import { TIMELINE } from './timeline.data';
import { TimelineKind } from '../models/timeline';

// ── Profile & contact ───────────────────────────────────
export const PROFILE = {
  name: 'Lucas del Pozo',
  role: 'Frontend Developer',
  email: 'lucas23delp@gmail.com',
  photo: 'images/lucas.webp',
  socials: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/FromTheWell' },
    { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/lucas-del-pozo' },
  ],
} as const;

// Optional: form backend (e.g. https://formspree.io/f/xxxx). Empty → the form opens the visitor's mail client.
export const CONTACT_FORM_ENDPOINT = '';

// ── Services ────────────────────────────────────────────
export interface Service {
  id: 'frontend' | 'backend';
  title: string;
  description: string;
  tags: string[];
}

export const SERVICES: Service[] = [
  {
    id: 'frontend',
    title: 'Frontend Development',
    description: 'I build fast, accessible and maintainable web applications with Angular: from reusable component libraries documented in Storybook to data-dense dashboards powered by signals, RxJS and NgRx.',
    tags: ['Angular', 'TypeScript', 'NgRx', 'Accessibility'],
  },
  {
    id: 'backend',
    title: 'Backend Development',
    description: 'I design REST APIs and business logic with Spring Boot and PHP on top of MySQL, owning the API contract end to end so frontend and backend evolve together.',
    tags: ['Spring Boot', 'Java', 'PHP', 'MySQL'],
  },
];

// ── Skills (derived from the technologies used in the timeline) ──
export interface Skill { label: string; icon: string; }

// Normalizes the free-text tech names of the timeline to an icon in /public/icons/tech
const TECH_ICONS: Array<{ match: RegExp; label: string; icon: string }> = [
  { match: /^angular/i, label: 'Angular', icon: 'angular' },
  { match: /^javascript$/i, label: 'JavaScript', icon: 'javascript' },
  { match: /^java$/i, label: 'Java', icon: 'java' },
  { match: /^spring\s?boot$/i, label: 'Spring Boot', icon: 'spring' },
  { match: /^php$/i, label: 'PHP', icon: 'php' },
  { match: /^mysql$/i, label: 'MySQL', icon: 'mysql' },
  { match: /^ngrx$/i, label: 'NgRx', icon: 'ngrx' },
  { match: /^rxjs$/i, label: 'RxJS', icon: 'rxjs' },
  { match: /^bootstrap$/i, label: 'Bootstrap', icon: 'bootstrap' },
  { match: /^nx$/i, label: 'Nx', icon: 'nx' },
  { match: /^storybook$/i, label: 'Storybook', icon: 'storybook' },
  { match: /^cypress$/i, label: 'Cypress', icon: 'cypress' },
  { match: /^jenkins$/i, label: 'Jenkins', icon: 'jenkins' },
];

export const SKILLS: Skill[] = (() => {
  // Most used technologies first
  const count = new Map<string, number>();
  for (const it of TIMELINE) {
    for (const t of new Set(it.tech ?? [])) {
      const def = TECH_ICONS.find(d => d.match.test(t.trim()));
      if (def) count.set(def.icon, (count.get(def.icon) ?? 0) + 1);
    }
  }
  return TECH_ICONS
    .filter(d => count.has(d.icon))
    .sort((a, b) => count.get(b.icon)! - count.get(a.icon)!)
    .map(d => ({ label: d.label, icon: `icons/tech/${d.icon}.svg` }));
})();

// ── Portfolio (derived from the links in the timeline) ──
export interface PortfolioItem {
  label: string;
  url: string;
  host: string;
  role: string;
  org?: string;
  kind: TimelineKind;
  tech: string[];
  preview?: string;
}

// Screenshots in /public/images/portfolio, keyed by link URL. Links without one show a placeholder.
const PREVIEWS: Record<string, string> = {
  'https://www.tribunavalladolid.com/': 'tribuna',
  'https://hub.isquad.es/': 'isquad',
  'https://www.jccm.es/': 'jccm',
  'https://www.futurespace.es/plataforma-de-investigacion/': 'smartgraph',
};

export const PORTFOLIO: PortfolioItem[] = TIMELINE
  .filter(it => it.links?.length)
  .sort((a, b) => b.start.localeCompare(a.start))
  .flatMap(it => it.links!.map(l => ({
    label: l.label.split(/\s[:\-–]\s/)[0].trim(),
    url: l.url,
    host: new URL(l.url).hostname.replace(/^www\./, ''),
    role: it.title,
    org: it.org,
    kind: it.kind,
    tech: (it.tech ?? []).slice(0, 3),
    preview: PREVIEWS[l.url] ? `images/portfolio/${PREVIEWS[l.url]}.webp` : undefined,
  })));
