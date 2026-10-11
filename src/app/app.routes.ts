import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { TimelineHomeComponent } from './features/timeline-home/timeline-home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Lucas del Pozo – Frontend Developer' },
  { path: 'timeline', component: TimelineHomeComponent, title: 'Lucas del Pozo – Timeline' },
  { path: '**', redirectTo: '' }
];
