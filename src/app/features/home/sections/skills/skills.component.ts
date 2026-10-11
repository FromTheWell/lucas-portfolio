import { Component } from '@angular/core';
import { SKILLS } from '../../../../data/site.data';

@Component({
  selector: 'app-skills',
  standalone: true,
  template: `
    <section class="section" id="skills" aria-labelledby="skills-title">
      <h2 class="section-title" id="skills-title">Skills</h2>
      <p class="lead">The skills, tools and technologies I use:</p>
      <ul>
        @for (s of skills; track s.label) {
          <li>
            <img [src]="s.icon" [alt]="" width="64" height="64" loading="lazy" />
            <span>{{ s.label }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    :host {
      display: block; border-bottom: 1px solid var(--line);
      background: radial-gradient(700px 360px at 30% 55%, rgba(122, 162, 247, .1), transparent);
    }
    .lead { margin: 0 0 2.5rem; text-align: center; font-size: 1.3rem; font-weight: 300; }
    ul {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;
      max-width: 760px; margin: 0 auto; padding: 0; list-style: none;
    }
    li {
      display: grid; justify-items: center; gap: .6rem; width: 104px; padding: 1.1rem .5rem .9rem;
      border: 1px solid transparent; border-radius: .9rem;
      transition: border-color .25s ease, background-color .25s ease, transform .25s ease;
      &:hover { transform: translateY(-4px); border-color: var(--line); background: rgba(18, 22, 27, .7); }
    }
    img {
      width: 64px; height: 64px; padding: 10px; object-fit: contain; border-radius: 1rem;
      // Light tile keeps dark logos (MySQL, Java, Cypress) readable on the dark theme
      background: radial-gradient(circle, rgba(230, 237, 243, .16), rgba(230, 237, 243, .05));
      filter: drop-shadow(0 0 .5px rgba(255, 255, 255, .35));
    }
    span { font-size: .78rem; color: var(--muted); }
  `
})
export class SkillsComponent {
  readonly skills = SKILLS;
}
