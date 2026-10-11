import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { History, LucideAngularModule, Menu, X } from 'lucide-angular';
import { PROFILE } from '../../data/site.data';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss'
})
export class SiteHeaderComponent {
  readonly name = PROFILE.name;
  readonly icons = { History, Menu, X };
  readonly sections = [
    { id: 'services', label: 'Services' },
    { id: 'skills', label: 'Skills' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'contact', label: 'Contact' },
  ];

  open = signal(false);
}
