import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';

import { mapApiError } from '../../core/api/api-error';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { safeReturnUrl } from '../../core/auth/auth.guard';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';

type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FrontendApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly mode = (this.route.snapshot.data['mode'] as Mode) ?? 'login';
  readonly pending = signal(false);
  readonly error = signal('');
  readonly success = signal(false);
  readonly title = computed(
    () =>
      ({
        login: 'Welcome back',
        register: 'Create your radar',
        'forgot-password': 'Recover access',
        'reset-password': 'Choose a new password',
      })[this.mode],
  );
  readonly form = this.fb.nonNullable.group({
    displayName: ['', this.mode === 'register' ? [Validators.required] : []],
    email: [
      this.route.snapshot.queryParamMap.get('email') ?? '',
      this.mode === 'reset-password' ? [] : [Validators.required, Validators.email],
    ],
    emailConfirm: ['', this.mode === 'register' ? [Validators.required, Validators.email] : []],
    password: [
      '',
      this.mode === 'forgot-password' ? [] : [Validators.required, Validators.minLength(8)],
    ],
    confirmPassword: [
      '',
      this.mode === 'register' || this.mode === 'reset-password' ? [Validators.required] : [],
    ],
  });

  emailInvalid(): boolean {
    const control = this.form.controls.email;
    return this.mode === 'register' && control.touched && control.invalid;
  }

  emailMismatch(): boolean {
    const control = this.form.controls.emailConfirm;
    return (
      this.mode === 'register' &&
      control.touched &&
      control.value !== this.form.controls.email.value
    );
  }

  passwordShort(): boolean {
    const control = this.form.controls.password;
    return control.touched && control.hasError('minlength');
  }

  passwordMismatch(): boolean {
    const control = this.form.controls.confirmPassword;
    return (
      (this.mode === 'register' || this.mode === 'reset-password') &&
      control.touched &&
      control.value !== this.form.controls.password.value
    );
  }

  submitDisabled(): boolean {
    return (
      this.pending() ||
      this.form.invalid ||
      (this.mode === 'register' &&
        this.form.controls.email.value !== this.form.controls.emailConfirm.value) ||
      ((this.mode === 'register' || this.mode === 'reset-password') &&
        this.form.controls.password.value !== this.form.controls.confirmPassword.value)
    );
  }

  submit(): void {
    this.error.set('');
    if (
      this.mode !== 'forgot-password' &&
      this.mode !== 'login' &&
      this.form.controls.password.value !== this.form.controls.confirmPassword.value
    ) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (
      this.mode === 'register' &&
      this.form.controls.email.value !== this.form.controls.emailConfirm.value
    ) {
      this.error.set('addresses do not match');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    const { email, password, displayName } = this.form.getRawValue();
    const request: Observable<unknown> =
      this.mode === 'login'
        ? this.auth.login(email, password)
        : this.mode === 'register'
          ? this.api.register({ email, password, displayName })
          : this.mode === 'forgot-password'
            ? this.api.forgotPassword(email)
            : this.api.resetPassword(
                this.route.snapshot.queryParamMap.get('token') ?? '',
                password,
              );
    request.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: () => {
        if (this.mode === 'login') {
          this.api.me().subscribe({
            next: (user) => {
              this.auth.updateUser(user);
              if (!user.emailVerifiedAt) {
                this.error.set('Confirm your email before continuing.');
                return;
              }
              const fallback = user.onboardingCompletedAt ? '/radar' : '/onboarding';
              const requested = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
              void this.router.navigateByUrl(requested === '/radar' ? fallback : requested);
            },
            error: (error: unknown) => this.error.set(mapApiError(error).message),
          });
        } else if (this.mode === 'register' || this.mode === 'forgot-password')
          this.success.set(true);
        else {
          this.success.set(true);
          setTimeout(() => void this.router.navigate(['/login']), 1200);
        }
      },
      error: (error: unknown) => this.error.set(mapApiError(error).message),
    });
  }

  resend(): void {
    const email = this.form.controls.email.value;
    if (!email) return;
    this.pending.set(true);
    this.api
      .resendVerification(email)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.success.set(true),
        error: (e: unknown) => this.error.set(mapApiError(e).message),
      });
  }
}
