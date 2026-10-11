import { Component } from '@angular/core';
import { LucideAngularModule, Monitor, Server } from 'lucide-angular';
import { SERVICES } from '../../../../data/site.data';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <section class="section" id="services" aria-labelledby="services-title">
      <h2 class="section-title" id="services-title">My services</h2>
      <div class="flow">
        @for (s of services; track s.id) {
          <article class="card">
            <h3><lucide-icon [img]="icons[s.id]" [size]="22"></lucide-icon>{{ s.title }}</h3>
            <p>{{ s.description }}</p>
            <ul>@for (t of s.tags; track t) { <li>{{ t }}</li> }</ul>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './services.component.scss'
})
export class ServicesComponent {
  readonly services = SERVICES;
  readonly icons = { frontend: Monitor, backend: Server };
}
