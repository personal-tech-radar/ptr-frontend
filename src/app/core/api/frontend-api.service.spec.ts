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
});
