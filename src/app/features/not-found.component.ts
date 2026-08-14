import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<main class="page">
    <section class="container panel">
      <p class="eyebrow">404 / unresolved symbol</p>
      <h1 class="page-title">This route is off the radar.</h1>
      <a class="btn btn--primary" routerLink="/">Return home</a>
    </section>
  </main>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
