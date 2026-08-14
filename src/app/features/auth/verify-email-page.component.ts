import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-verify-email-page',
  imports: [RouterLink],
  template: `<main class="page artwork-page">
    <section class="container panel verify">
      <p class="eyebrow">Email action</p>
      <h1 class="page-title">Verify your email</h1>
      <p class="prose">{{ message() }}</p>
      @if (done()) {
        <a class="btn btn--primary" routerLink="/login" [queryParams]="{ returnUrl: '/onboarding' }"
          >Continue</a
        >
      }
    </section>
  </main>`,
  styles: `
    .verify {
      max-width: 38rem;
      margin-inline: auto;
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
        if (this.auth.authenticated()) void this.router.navigate(['/onboarding']);
        else {
          this.message.set('Email verified. You can now sign in.');
          this.done.set(true);
        }
      },
      error: () => {
        this.message.set('This verification link is invalid, expired, or already used.');
        this.done.set(true);
      },
    });
  }
}
