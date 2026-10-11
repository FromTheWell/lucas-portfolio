import { Component } from '@angular/core';
import { ArrowUpRight, LucideAngularModule } from 'lucide-angular';
import { PORTFOLIO } from '../../../../data/site.data';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent {
  readonly items = PORTFOLIO;
  readonly ArrowUpRight = ArrowUpRight;
}
