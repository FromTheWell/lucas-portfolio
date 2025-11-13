import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren, PLATFORM_ID, inject } from '@angular/core';
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


// Flag SSR/browser
private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

// Accessibility: focus ring en navegación con teclado sólo en browser
constructor() {
	if (this.isBrowser) {
		effect(() => {
			const handler = (e: KeyboardEvent) => {
				if (e.key === 'Tab') document.documentElement.classList.add('using-keyboard');
			};
			const mouse = () => document.documentElement.classList.remove('using-keyboard');
			window.addEventListener('keydown', handler);
			window.addEventListener('mousedown', mouse);
			// Limpieza cuando el efecto se elimina
			return () => {
				window.removeEventListener('keydown', handler);
				window.removeEventListener('mousedown', mouse);
			};
		});
	}
}

@ViewChild('timelineContainer') private container!: ElementRef<HTMLDivElement>;
@ViewChild('searchBox') private searchBox!: ElementRef<HTMLInputElement>;
@ViewChildren('entryEl') private entries!: QueryList<ElementRef<HTMLElement>>;

private activeEntry?: HTMLElement;
private removeListeners: Array<() => void> = [];
	private viewReady = false;
private mo?: MutationObserver;
private recalcTimer: any;
	// Señal para marcar cuando la rail y spotlight tienen medidas válidas (evita flicker inicial)
	railReady = signal(false);
	private prevRailStart = 0;
	private prevRailEnd = 0;
	private prevRailLeft = 0;
		// Effect que reacciona a cambios en items una vez la vista está lista (debe declararse en contexto de inyección)
		private itemsRecalcEffect = effect(() => {
			// Se suscribe a items(); sólo recalcula si la vista ya fue inicializada
			void this.items();
			if (this.viewReady) {
				queueMicrotask(() => this.scheduleRecalc());
			}
		});


ngAfterViewInit(): void {
		// En SSR salimos (no hay window ni layout que medir)
		if (!this.isBrowser) return;
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
		// La reacción a cambios de items se maneja por itemsRecalcEffect (arriba)

		// Observa cambios en el DOM del contenedor (por si el *ngFor* regenera nodos)
		if (this.container?.nativeElement && 'MutationObserver' in window) {
			this.mo = new MutationObserver(() => this.scheduleRecalc());
			this.mo.observe(this.container.nativeElement, { childList: true, subtree: true });
		}

		// Ya no usamos clases para rail base; *ngIf en template controla visibilidad.

		// Workaround: algunos content scripts (extensiones del navegador) se enganchan al focusin del documento
		// y petan con campos de tipo search. Capturamos el focusin solo en este input y cortamos propagación
		// para evitar que llegue al handler global del content script.
		if (this.isBrowser && this.searchBox?.nativeElement) {
			const el = this.searchBox.nativeElement;
			const stopDocFocusHandlers = (e: Event) => { e.stopPropagation(); };
			el.addEventListener('focusin', stopDocFocusHandlers, true);
			this.removeListeners.push(() => el.removeEventListener('focusin', stopDocFocusHandlers, true));

			// Al escribir, algunas extensiones escuchan 'input'/'beforeinput' a nivel de document y fallan.
			// Detenemos el bubbling de estos eventos desde el elemento tras permitir que Angular procese primero.
			const stopBubble = (e: Event) => { e.stopPropagation(); };
			['input', 'beforeinput', 'change', 'keydown', 'keyup', 'compositionstart', 'compositionupdate', 'compositionend']
				.forEach(type => {
					el.addEventListener(type, stopBubble, false);
					this.removeListeners.push(() => el.removeEventListener(type, stopBubble, false));
				});
		}
}

ngOnDestroy(): void {
 for (const off of this.removeListeners) off();
 if (this.mo) this.mo.disconnect();
}

// Calcula el inicio y fin de la línea superior que recorre los dots
 private updateRailBounds(): void {
 if (!this.isBrowser) return;
 const containerEl = this.container?.nativeElement;
 if (!containerEl) return;

	// Fuente de verdad: ¿hay items lógicos tras filtros?
	if ((this.items()?.length ?? 0) === 0) {
		// container no existe (ngIf), no limpiar para evitar flash en futuro render
		this.railReady.set(false);
		return;
	}

 const entryEls = this.entries?.toArray().map(r => r.nativeElement).filter(el => el.offsetParent !== null) ?? [];
if (!entryEls.length) {
	// Reintentar en próximo frame si aún no están listos
	requestAnimationFrame(() => this.updateRailBounds());
	return; // no forzar limpiezas ni apagar efectos previos
}

 const firstDot = entryEls[0].querySelector('.dot') as HTMLElement | null;
 const lastDot = entryEls[entryEls.length - 1].querySelector('.dot') as HTMLElement | null;
if (!firstDot || !lastDot) {
	requestAnimationFrame(() => this.updateRailBounds());
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
		this.prevRailStart = s;
		this.prevRailEnd = e;
	}
	containerEl.style.setProperty('--rail-left', `${railLeft}px`);
	this.prevRailLeft = railLeft;
	// Medidas válidas -> activar efectos visuales
	this.railReady.set(true);
}

	// Encadena varios frames para asegurar que layout y estilos están listos
private scheduleRecalc(): void {
	if (!this.isBrowser) return; // No recalcular en SSR
	clearTimeout(this.recalcTimer);
	this.recalcTimer = setTimeout(() => {
		const raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : (fn: FrameRequestCallback) => setTimeout(fn, 16);
		raf(() => {
			raf(() => {
				this.updateRailBounds();
				this.updateSpotlight();
			});
		});
	}, 30);
}

// Actualiza la posición del spotlight y el color activo según la tarjeta más centrada
 private updateSpotlight(): void {
 if (!this.isBrowser) return;
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
