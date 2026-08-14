import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';
import { of, switchMap } from 'rxjs';

@Component({
  selector: 'app-verify-email-page',
  imports: [RouterLink, HeaderComponent, FooterComponent],
  template: `<div class="page artwork-page">
    <app-header actionLabel="← Back to today's radar" actionLink="/" />
    <main class="container verify-wrap">
      <section class="panel verify">
        <p class="eyebrow">Email action</p>
        <h1 class="page-title">Verify your email</h1>
        <p class="prose">{{ message() }}</p>
        @if (done()) {
          <a
            class="btn btn--primary"
            routerLink="/login"
            [queryParams]="{ returnUrl: '/onboarding' }"
            >Continue</a
          >
        }
      </section>
    </main>
    <app-footer />
  </div>`,
  styles: `
    .verify {
      max-width: 440px;
    }
    .verify-wrap {
      padding-top: 56px;
      position: relative;
      z-index: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FrontendApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  readonly message = signal('Verifying your link…');
  readonly done = signal(false);
  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.message.set('This verification link is missing its token.');
      this.done.set(true);
      return;
    }
    this.api.verifyEmail(token).subscribe({
      next: () => {
        this.auth
          .restore()
          .pipe(switchMap((user) => (user ? this.api.me() : of(null))))
          .subscribe({
            next: (user) => {
              if (user) this.auth.updateUser(user);
              void this.router.navigate(['/onboarding']);
            },
            error: () =>
              void this.router.navigate(['/login'], {
                queryParams: { returnUrl: '/onboarding' },
              }),
          });
      },
      error: () => {
        this.message.set('This verification link is invalid, expired, or already used.');
        this.done.set(true);
      },
    });
  }
}
