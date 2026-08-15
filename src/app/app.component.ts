import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthSessionService } from './core/auth/auth-session.service';
import { RouteSeoService } from './core/seo/route-seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly session = inject(AuthSessionService);
  private readonly seo = inject(RouteSeoService);
  constructor() {
    this.seo.start();
    afterNextRender(() => this.session.restore().subscribe());
  }
}
