import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Github, Linkedin, LucideAngularModule, Mail } from 'lucide-angular';
import { PROFILE } from '../../../../data/site.data';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  readonly profile = PROFILE;
  readonly icons: Record<string, typeof Github> = { github: Github, linkedin: Linkedin, mail: Mail };
  // Decorative code fragments floating behind the photo
  readonly snippets = [
    { text: 'ng serve --open', x: 4, y: 18 },
    { text: '<app-root>', x: 66, y: 12 },
    { text: 'signal<T>()', x: 0, y: 40 },
    { text: '@for (item of items)', x: 62, y: 34 },
    { text: '@RestController', x: 8, y: 62 },
    { text: 'mvn spring-boot:run', x: 64, y: 58 },
  ];
}
