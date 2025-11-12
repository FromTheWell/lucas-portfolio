import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class TimelineHomeComponent {
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
}
