import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import { AuthTokens, User } from '../models/api.models';

const REFRESH_KEY = 'ptr.refresh';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly accessToken = signal<string | null>(null);
  private readonly currentUser = signal<User | null>(null);
  private refreshRequest?: Observable<string | null>;

  readonly user = this.currentUser.asReadonly();
  readonly authenticated = computed(() => this.currentUser() !== null);

  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthTokens>(`${APP_CONFIG.apiUrl}/auth/login`, { email, password }).pipe(
      tap((tokens) => this.accept(tokens)),
      map((tokens) => tokens.user),
    );
  }

  restore(): Observable<User | null> {
    if (this.currentUser()) return of(this.currentUser());
    return this.refresh().pipe(map((token) => (token ? this.currentUser() : null)));
  }

  refresh(): Observable<string | null> {
    if (!this.browser) return of(null);
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return of(null);
    if (this.refreshRequest) return this.refreshRequest;

    this.refreshRequest = this.http
      .post<AuthTokens>(`${APP_CONFIG.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((tokens) => this.accept(tokens)),
        map((tokens) => tokens.accessToken),
        finalize(() => (this.refreshRequest = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshRequest;
  }

  logout(): Observable<void> {
    const refreshToken = this.browser ? sessionStorage.getItem(REFRESH_KEY) : null;
    const request = refreshToken
      ? this.http.post<void>(`${APP_CONFIG.apiUrl}/auth/logout`, { refreshToken })
      : of(undefined);
    return request.pipe(finalize(() => this.clear()));
  }

  updateUser(user: User): void {
    this.currentUser.set(user);
  }

  token(): string | null {
    return this.accessToken();
  }

  clear(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    if (this.browser) sessionStorage.removeItem(REFRESH_KEY);
  }

  private accept(tokens: AuthTokens): void {
    this.accessToken.set(tokens.accessToken);
    this.currentUser.set(tokens.user);
    if (this.browser) sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}
