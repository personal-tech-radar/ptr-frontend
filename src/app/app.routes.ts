import { Routes } from '@angular/router';
import { authGuard, guestGuard, homeGuard } from './core/auth/auth.guard';
import { signalResolver } from './features/signals/signal.resolver';
import { infoPageResolver } from './features/info/info-page.resolver';

const authPage = () =>
  import('./features/auth/auth-page.component').then((m) => m.AuthPageComponent);

export const routes: Routes = [
  {
    path: '',
    data: {
      index: true,
      description:
        'One place for releases, engineering blogs, vulnerabilities and expert opinions.',
    },
    canActivate: [homeGuard],
    title: 'Personal Tech Radar — useful engineering signals',
    loadComponent: () =>
      import('./features/home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'login',
    title: 'Login — Personal Tech Radar',
    data: { mode: 'login' },
    canActivate: [guestGuard],
    loadComponent: authPage,
  },
  {
    path: 'register',
    title: 'Register — Personal Tech Radar',
    data: { mode: 'register' },
    canActivate: [guestGuard],
    loadComponent: authPage,
  },
  {
    path: 'forgot-password',
    title: 'Recover access — Personal Tech Radar',
    data: { mode: 'forgot-password' },
    loadComponent: authPage,
  },
  {
    path: 'reset-password',
    title: 'Reset password — Personal Tech Radar',
    data: { mode: 'reset-password' },
    loadComponent: authPage,
  },
  {
    path: 'verify-email',
    title: 'Verify email — Personal Tech Radar',
    loadComponent: () =>
      import('./features/auth/verify-email-page.component').then((m) => m.VerifyEmailPageComponent),
  },
  {
    path: 'auth/verify-email',
    title: 'Verify email — Personal Tech Radar',
    loadComponent: () =>
      import('./features/auth/verify-email-page.component').then((m) => m.VerifyEmailPageComponent),
  },
  {
    path: 'auth/password/reset',
    title: 'Reset password — Personal Tech Radar',
    data: { mode: 'reset-password' },
    loadComponent: authPage,
  },
  {
    path: 'onboarding',
    title: 'Tune your radar — Personal Tech Radar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding-page.component').then(
        (m) => m.OnboardingPageComponent,
      ),
  },
  {
    path: 'radar',
    title: 'Your radar — Personal Tech Radar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/radar/radar-page.component').then((m) => m.RadarPageComponent),
  },
  {
    path: 'profile',
    title: 'Profile — Personal Tech Radar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile-page.component').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'signals/:id',
    data: { index: true },
    resolve: { signal: signalResolver },
    loadComponent: () =>
      import('./features/signals/signal-page.component').then((m) => m.SignalPageComponent),
  },
  {
    path: 'info/:id',
    data: { index: true },
    resolve: { page: infoPageResolver },
    loadComponent: () =>
      import('./features/info/info-page.component').then((m) => m.InfoPageComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
