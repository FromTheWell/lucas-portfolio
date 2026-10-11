import { Component } from '@angular/core';
import { PROFILE } from '../../data/site.data';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  template: `<footer><p>© {{ year }} · All rights reserved · Design and development by {{ name }}</p></footer>`,
  styles: `
    :host { display: block; font-family: var(--font-display); border-top: 1px solid var(--line); }
    footer { max-width: 1080px; margin: 0 auto; padding: 1.75rem 1.25rem; }
    p { margin: 0; color: var(--muted); font-size: .8rem; }
  `
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();
  readonly name = PROFILE.name;
}
