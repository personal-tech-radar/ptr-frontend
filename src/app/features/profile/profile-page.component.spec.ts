import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { User, UserTaxonomy } from '../../core/models/api.models';
import { ProfilePageComponent } from './profile-page.component';

const user: User = {
  id: 'user-id',
  email: 'jane@example.com',
  displayName: 'Jane',
  timezone: 'Europe/Tbilisi',
  githubUrl: null,
  level: 'middle',
  dailyDigestEnabled: false,
  weeklyDigestEnabled: false,
  emailVerifiedAt: '2026-08-01T00:00:00Z',
  onboardingCompletedAt: '2026-08-01T00:00:00Z',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const selectedTaxonomy: UserTaxonomy = {
  level: 'middle',
  technologyInterests: [
    { id: 'terraform', kind: 'technology', name: 'Terraform', aliases: [] },
    { id: 'platform', kind: 'interest', name: 'Platform engineering', aliases: [] },
  ],
  contentStreams: [],
  onboardingCompletedAt: '2026-08-01T00:00:00Z',
};

describe('ProfilePageComponent', () => {
  it('keeps the user selections visible when an optional catalog request fails', async () => {
    const api = {
      me: () => of(user),
      streams: () => of([]),
      userTaxonomy: () => of(selectedTaxonomy),
      taxonomy: () => throwError(() => new Error('catalog unavailable')),
      infoPages: () => of([]),
    };
    const auth = {
      user: signal<User | null>(user),
      updateUser: vi.fn(),
      clear: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideRouter([]),
        { provide: FrontendApiService, useValue: api },
        { provide: AuthSessionService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.technologies().map((item) => item.name)).toEqual([
      'Terraform',
    ]);
    expect(fixture.componentInstance.interests().map((item) => item.name)).toEqual([
      'Platform engineering',
    ]);
  });
});
