import { Routes } from '@angular/router';
import { TimelineHomeComponent } from './features/timeline-home/timeline-home.component';

export const routes: Routes = [
  { path: '', component: TimelineHomeComponent, title: 'Lucas del Pozo - Portfolio' },
  { path: '**', redirectTo: '' }
];
