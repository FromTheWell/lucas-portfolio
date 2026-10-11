import { Component } from '@angular/core';
import { HeroComponent } from './sections/hero/hero.component';
import { ServicesComponent } from './sections/services/services.component';
import { SkillsComponent } from './sections/skills/skills.component';
import { PortfolioComponent } from './sections/portfolio/portfolio.component';
import { ContactComponent } from './sections/contact/contact.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, ServicesComponent, SkillsComponent, PortfolioComponent, ContactComponent],
  template: `
    <app-hero />
    <app-services />
    <app-skills />
    <app-portfolio />
    <app-contact />
  `,
  styles: `:host { display: block; font-family: var(--font-display); }`
})
export class HomeComponent {}
