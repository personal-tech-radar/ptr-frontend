import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { FrontendApiService } from './frontend-api.service';

describe('FrontendApiService feedback', () => {
  it('sends the feedback type required by the live API contract', async () => {
    TestBed.configureTestingModule({
      providers: [FrontendApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(FrontendApiService);
    const http = TestBed.inject(HttpTestingController);

    const response = firstValueFrom(api.feedback('article-id', 'not_useful'));
    const request = http.expectOne('/api/backend/articles/article-id/feedback');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ type: 'not_useful' });
    request.flush({});
    await response;
    http.verify();
  });

  it('uses the live password recovery endpoints and reset payload', async () => {
    TestBed.configureTestingModule({
      providers: [FrontendApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(FrontendApiService);
    const http = TestBed.inject(HttpTestingController);

    const forgotResponse = firstValueFrom(api.forgotPassword('jane@example.com'));
    const forgotRequest = http.expectOne('/api/backend/auth/password/forgot');
    expect(forgotRequest.request.method).toBe('POST');
    expect(forgotRequest.request.body).toEqual({ email: 'jane@example.com' });
    forgotRequest.flush({ message: 'If the email exists, a reset link has been sent' });
    await forgotResponse;

    const resetResponse = firstValueFrom(api.resetPassword('reset-token', 'new-password'));
    const resetRequest = http.expectOne('/api/backend/auth/password/reset');
    expect(resetRequest.request.method).toBe('POST');
    expect(resetRequest.request.body).toEqual({
      token: 'reset-token',
      newPassword: 'new-password',
    });
    resetRequest.flush({ message: 'Password reset' });
    await resetResponse;
    http.verify();
  });
});
