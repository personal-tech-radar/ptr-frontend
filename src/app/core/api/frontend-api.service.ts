import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import {
  ContentStream,
  FeedResponse,
  FeedbackType,
  OnboardingPayload,
  PublicFeedResponse,
  PublicSignal,
  SignalItem,
  TaxonomyItem,
  TaxonomyKind,
  User,
  UserTaxonomy,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class FrontendApiService {
  private readonly http = inject(HttpClient);
  private readonly api = APP_CONFIG.apiUrl;

  register(body: { email: string; password: string; displayName: string }) {
    return this.http.post<void>(`${this.api}/auth/register`, body);
  }
  resendVerification(email: string) {
    return this.http.post<void>(`${this.api}/auth/verification/resend`, { email });
  }
  verifyEmail(token: string) {
    return this.http.get<void>(`${this.api}/auth/verify-email`, { params: { token } });
  }
  forgotPassword(email: string) {
    return this.http.post<void>(`${this.api}/auth/forgot-password`, { email });
  }
  resetPassword(token: string, newPassword: string) {
    return this.http.post<void>(`${this.api}/auth/reset-password`, { token, newPassword });
  }
  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<void>(`${this.api}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
  me() {
    return this.http.get<User>(`${this.api}/users/me`);
  }
  updateMe(body: Partial<User>) {
    return this.http.patch<User>(`${this.api}/users/me`, body);
  }
  deleteMe() {
    return this.http.delete<void>(`${this.api}/users/me`);
  }
  onboarding(body: OnboardingPayload) {
    return this.http.post<User>(`${this.api}/users/me/onboarding`, body);
  }
  userTaxonomy() {
    return this.http.get<UserTaxonomy>(`${this.api}/users/me/taxonomy`);
  }
  streams() {
    return this.http.get<ContentStream[]>(`${this.api}/content-streams`);
  }
  taxonomy(kind: TaxonomyKind, q = '') {
    const params = new HttpParams().set('kind', kind).set('q', q).set('page', 1).set('limit', 30);
    return this.http
      .get<{ data?: TaxonomyItem[] } | TaxonomyItem[]>(`${this.api}/technology-interests`, {
        params,
      })
      .pipe(map((value) => (Array.isArray(value) ? value : (value.data ?? []))));
  }
  radar() {
    return this.http.get<FeedResponse>(`${this.api}/feed`);
  }
  publicFeed() {
    return this.http.get<PublicFeedResponse>(`${APP_CONFIG.publicApiUrl}/public/feed`, {
      params: { page: 1, limit: 18 },
    });
  }
  preview(body: object) {
    return this.http.post<PublicFeedResponse>(`${APP_CONFIG.publicApiUrl}/feed/preview`, body);
  }
  publicSignal(id: string) {
    return this.http.get<PublicSignal>(`${APP_CONFIG.publicApiUrl}/signals/${id}`);
  }
  save(id: string) {
    return this.http.post<void>(`${this.api}/saved-articles/${id}`, {});
  }
  unsave(id: string) {
    return this.http.delete<void>(`${this.api}/saved-articles/${id}`);
  }
  feedback(id: string, feedback: FeedbackType) {
    return this.http.post<void>(`${this.api}/articles/${id}/feedback`, { feedback });
  }
}

export function publicToSignal(item: PublicSignal): SignalItem {
  const source = item.source as { name?: string } | string | null;
  return {
    articleId: item.articleId ?? item.id,
    title: item.title,
    url: item.publicRedirectUrl || item.originalUrl,
    sourceName: typeof source === 'string' ? source : (source?.name ?? 'Independent source'),
    publishedAt: item.publishedAt ?? '',
    shortSummary: item.summary ?? '',
    complexityLevel: (item.complexity as SignalItem['complexityLevel']) ?? null,
    materialType: item.primaryStream?.name ?? item.streams?.[0]?.name ?? null,
  };
}
