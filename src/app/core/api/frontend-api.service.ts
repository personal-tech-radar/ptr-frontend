import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import {
  ContentStream,
  FeedResponse,
  FeedbackType,
  AuthTokens,
  InfoPage,
  InfoPageListItem,
  OnboardingPayload,
  PublicFeedResponse,
  PreviewFeedResponse,
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
    return this.http.post<AuthTokens>(`${this.api}/auth/register`, body);
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
  publicTaxonomy(kind: TaxonomyKind, page = 1) {
    const params = new HttpParams().set('kind', kind).set('page', page).set('limit', 100);
    return this.http.get<{ data: TaxonomyItem[]; meta: { page: number; totalPages: number } }>(
      `${APP_CONFIG.publicApiUrl}/public/technology-interests`,
      { params },
    );
  }
  publicStreams() {
    return this.http.get<ContentStream[]>(`${APP_CONFIG.publicApiUrl}/public/content-streams`);
  }
  radar(
    filters: {
      stream?: string[];
      technology?: string[];
      interest?: string[];
      saved?: boolean;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    let params = new HttpParams();
    for (const value of filters.stream ?? []) params = params.append('stream', value);
    for (const value of filters.technology ?? []) params = params.append('technology', value);
    for (const value of filters.interest ?? []) params = params.append('interest', value);
    if (filters.saved) params = params.set('saved', true);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<FeedResponse>(`${this.api}/feed`, { params });
  }
  publicFeed(filters: { page?: number; limit?: number; dateFrom?: string; dateTo?: string } = {}) {
    let params = new HttpParams().set('page', filters.page ?? 1).set('limit', filters.limit ?? 100);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<PublicFeedResponse>(`${APP_CONFIG.publicApiUrl}/public/feed`, {
      params,
    });
  }
  preview(body: {
    technologyInterestIds: string[];
    contentStreamIds: string[];
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.http.post<PreviewFeedResponse>(`${APP_CONFIG.publicApiUrl}/feed/preview`, body);
  }
  infoPages() {
    return this.http
      .get<{ data: InfoPageListItem[] }>(`${APP_CONFIG.publicApiUrl}/info-pages`, {
        params: { page: 1, limit: 20 },
      })
      .pipe(map((response) => response.data));
  }
  infoPage(id: string) {
    return this.http.get<InfoPage>(`${APP_CONFIG.publicApiUrl}/info-pages/${id}`);
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
    streamId: item.primaryStream?.id ?? item.streams?.[0]?.id ?? null,
    streamName: item.primaryStream?.name ?? item.streams?.[0]?.name ?? null,
  };
}
