import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TIMELINE } from '../../data/timeline.data';
import { TimelineItem } from '../../models/timeline';


// Helper: year string from ISO or 'present'
function yearOf(date?: string): string {
if (!date) return '';
if (date.toLowerCase() === 'present') return 'Ahora';
return new Date(date).getFullYear().toString();
}


@Component({
selector: 'app-timeline-home',
standalone: true,
imports: [CommonModule],
templateUrl: './timeline-home.component.html',
styleUrls: ['./timeline-home.component.scss']
})
export class TimelineHomeComponent implements AfterViewInit, OnDestroy {
// Raw data
private all = signal<TimelineItem[]>([...TIMELINE]);


// Filters
kinds = ['all', 'job', 'project', 'education', 'award', 'talk', 'oss'] as const;
kind = signal<(typeof this.kinds)[number]>('all');
search = signal('');


// Derived (group by year)
items = computed(() => {
const k = this.kind();
const q = this.search().toLowerCase();
return this.all().filter(it => {
const okKind = k === 'all' ? true : it.kind === k;
const hay = `${it.title} ${it.org ?? ''} ${it.description ?? ''} ${it.tech?.join(' ') ?? ''}`.toLowerCase();
return okKind && (!q || hay.includes(q));
}).sort((a, b) => {
// sort by end desc then start desc
const byEnd = (b.end ?? b.start ?? '').localeCompare(a.end ?? a.start ?? '');
if (byEnd !== 0) return byEnd;
return (b.start ?? '').localeCompare(a.start ?? '');
});
});


groups = computed(() => {
const map = new Map<string, TimelineItem[]>();
for (const it of this.items()) {
const y = yearOf(it.end === 'present' ? new Date().toISOString() : (it.end || it.start));
const key = y || 'Sin fecha';
const arr = map.get(key) ?? [];
arr.push(it);
map.set(key, arr);
}
// Convert to array sorted by year desc ("Ahora" first)
const entries = Array.from(map.entries());
entries.sort((a, b) => {
const ay = a[0] === 'Ahora' ? '9999' : a[0];
const by = b[0] === 'Ahora' ? '9999' : b[0];
return by.localeCompare(ay);
});
return entries;
});


// Accessibility: focus ring on keyboard nav only
constructor() {
effect(() => {
const handler = (e: KeyboardEvent) => {
if (e.key === 'Tab') document.documentElement.classList.add('using-keyboard');
};
const mouse = () => document.documentElement.classList.remove('using-keyboard');
window.addEventListener('keydown', handler);
window.addEventListener('mousedown', mouse);
});
}

@ViewChild('timelineContainer') private container!: ElementRef<HTMLDivElement>;
@ViewChildren('entryEl') private entries!: QueryList<ElementRef<HTMLElement>>;

private activeEntry?: HTMLElement;
private removeListeners: Array<() => void> = [];
	private viewReady = false;
private mo?: MutationObserver;

ngAfterViewInit(): void {
		// Marca que la vista ya está lista para medir
		this.viewReady = true;
		// Recalcula tras el primer render usando rAF para asegurar layout listo
		this.scheduleRecalc();

 // Recalcular cuando cambian las entradas (por filtros/búsqueda)
 this.entries.changes.subscribe(() => {
 this.scheduleRecalc();
 });

 const onScroll = () => this.updateSpotlight();
 const onResize = () => { this.scheduleRecalc(); };
 const onLoad = () => { this.scheduleRecalc(); };
 window.addEventListener('scroll', onScroll, { passive: true });
 window.addEventListener('resize', onResize);
 window.addEventListener('load', onLoad);
 this.removeListeners.push(() => window.removeEventListener('scroll', onScroll));
 this.removeListeners.push(() => window.removeEventListener('resize', onResize));
 this.removeListeners.push(() => window.removeEventListener('load', onLoad));
		// Recalcular cuando cambien los items (filtros/búsqueda) una vez la vista existe
		effect(() => {
			void this.items(); // suscribirse
			if (this.viewReady) {
				// microtask tras render
				queueMicrotask(() => this.scheduleRecalc());
			}
		});

		// Observa cambios en el DOM del contenedor (por si el *ngFor* regenera nodos)
		if (this.container?.nativeElement && 'MutationObserver' in window) {
			this.mo = new MutationObserver(() => this.scheduleRecalc());
			this.mo.observe(this.container.nativeElement, { childList: true, subtree: true });
		}

		// Mostrar/ocultar rail base en función de si hay items lógicos
		effect(() => {
			const count = this.items().length;
			if (!this.viewReady || !this.container?.nativeElement) return;
			const el = this.container.nativeElement;
			if (count === 0) {
				el.classList.add('no-rail');
				el.classList.remove('has-rail-progress');
				el.style.removeProperty('--rail-start');
				el.style.removeProperty('--rail-end');
				el.style.removeProperty('--rail-left');
			} else {
				el.classList.remove('no-rail');
			}
		});
}

ngOnDestroy(): void {
 for (const off of this.removeListeners) off();
 if (this.mo) this.mo.disconnect();
}

// Calcula el inicio y fin de la línea superior que recorre los dots
 private updateRailBounds(): void {
 const containerEl = this.container?.nativeElement;
 if (!containerEl) return;

	// Fuente de verdad: ¿hay items lógicos tras filtros?
	const hasLogicalItems = (this.items()?.length ?? 0) > 0;
	if (!hasLogicalItems) {
		// Sin items: ocultar todo lo relacionado con rail
		containerEl.style.removeProperty('--rail-start');
		containerEl.style.removeProperty('--rail-end');
		containerEl.style.removeProperty('--rail-left');
		containerEl.classList.remove('has-rail-progress');
		containerEl.classList.add('no-rail');
		return;
	}
	// Hay items: aseguramos mostrar rail base
	containerEl.classList.remove('no-rail');

 const entryEls = this.entries?.toArray().map(r => r.nativeElement).filter(el => el.offsetParent !== null) ?? [];
 if (!entryEls.length) {
 containerEl.style.removeProperty('--rail-start');
 containerEl.style.removeProperty('--rail-end');
		containerEl.style.removeProperty('--rail-left');
			containerEl.classList.remove('has-rail-progress');
		// No añadimos no-rail porque sí existen items; solo aún no están medibles
 return;
 }

 const firstDot = entryEls[0].querySelector('.dot') as HTMLElement | null;
 const lastDot = entryEls[entryEls.length - 1].querySelector('.dot') as HTMLElement | null;
 if (!firstDot || !lastDot) {
	 containerEl.style.removeProperty('--rail-start');
	 containerEl.style.removeProperty('--rail-end');
	 containerEl.style.removeProperty('--rail-left');
	 containerEl.classList.remove('has-rail-progress');
	 // No añadimos no-rail porque sí hay items
 	 return;
 }

 const cRect = containerEl.getBoundingClientRect();
 const fRect = firstDot.getBoundingClientRect();
 const lRect = lastDot.getBoundingClientRect();

 const start = (fRect.top - cRect.top) + (fRect.height / 2);
 const end = (lRect.top - cRect.top) + (lRect.height / 2);
	const railLeft = (fRect.left - cRect.left) + (fRect.width / 2);

		let s = Math.max(0, Math.min(start, end));
		let e = Math.max(start, end);
		// Altura mínima para que sea visible incluso con 1 dot
		if (e - s < 2) e = s + 2;
		// Evita alturas negativas o NaN y asegura que se establecen correctamente
		if (isFinite(s) && isFinite(e) && e >= s) {
			containerEl.style.setProperty('--rail-start', `${s}px`);
			containerEl.style.setProperty('--rail-end', `${e}px`);
        containerEl.classList.add('has-rail-progress');
        containerEl.classList.remove('no-rail');
		}
	containerEl.style.setProperty('--rail-left', `${railLeft}px`);
}

	// Encadena varios frames para asegurar que layout y estilos están listos
	private scheduleRecalc(): void {
		requestAnimationFrame(() => {
			this.updateRailBounds();
			this.updateSpotlight();
			// Segundo frame por si hay fuentes/scrollbar que cambian medidas
			requestAnimationFrame(() => {
				this.updateRailBounds();
				this.updateSpotlight();
				// Tercer intento tardío para estados intermedios de DOM/pintado
				setTimeout(() => {
					this.updateRailBounds();
					this.updateSpotlight();
				}, 60);
			});
		});
	}

// Actualiza la posición del spotlight y el color activo según la tarjeta más centrada
private updateSpotlight(): void {
 const containerEl = this.container?.nativeElement;
 if (!containerEl) return;

 const cRect = containerEl.getBoundingClientRect();
 const viewportCenterY = window.innerHeight / 2;
 const spotY = viewportCenterY - cRect.top; // relativo al contenedor
 containerEl.style.setProperty('--spot-y', `${spotY}px`);

 const entryEls = this.entries?.toArray().map(r => r.nativeElement).filter(el => el.offsetParent !== null) ?? [];
 if (!entryEls.length) return;

 // Encuentra la más cercana al centro de la ventana
 let best: { el: HTMLElement; dist: number } | null = null;
 for (const el of entryEls) {
 const r = el.getBoundingClientRect();
 const center = (r.top + r.bottom) / 2;
 const dist = Math.abs(center - viewportCenterY);
 if (!best || dist < best.dist) best = { el, dist };
 }
 if (!best) return;

 // Toggle clase activa
 if (this.activeEntry && this.activeEntry !== best.el) this.activeEntry.classList.remove('active');
 this.activeEntry = best.el;
 best.el.classList.add('active');

 // Define color según el kind
 const kind = best.el.getAttribute('data-kind') ?? 'default';
 const hex = this.kindToHex(kind);
 const [r, g, b] = this.hexToRgb(hex);
 containerEl.style.setProperty('--spot-color', `rgba(${r}, ${g}, ${b}, 0.18)`);
 containerEl.style.setProperty('--spot-strong', `rgba(${r}, ${g}, ${b}, 0.35)`);
}

private kindToHex(kind: string): string {
 switch (kind) {
 case 'project': return '#a7f3d0';
 case 'job': return '#93c5fd';
 case 'education': return '#fde68a';
 case 'award': return '#fca5a5';
 case 'talk': return '#c7d2fe';
 case 'oss': return '#ddd6fe';
 default: return '#7aa2f7'; // accent
 }
}

private hexToRgb(hex: string): [number, number, number] {
 const cleaned = hex.replace('#', '');
 const bigint = parseInt(cleaned.length === 3
 ? cleaned.split('').map(c => c + c).join('')
 : cleaned, 16);
 const r = (bigint >> 16) & 255;
 const g = (bigint >> 8) & 255;
 const b = bigint & 255;
 return [r, g, b];
}
}
