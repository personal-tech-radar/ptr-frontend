import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Data, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { FrontendApiService } from '../../core/api/frontend-api.service';
import { InfoPage } from '../../core/models/api.models';
import { InfoPageComponent } from './info-page.component';

const legalPage: InfoPage = {
  id: 'legal',
  title: 'Legal Notice',
  fullText: 'Legal content',
  isActive: true,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const privacyPage: InfoPage = {
  ...legalPage,
  id: 'privacy',
  title: 'Privacy Policy',
  fullText: 'Privacy content',
  updatedAt: '2026-08-02T00:00:00Z',
};

describe('InfoPageComponent', () => {
  it('updates content and metadata when navigating between info pages', async () => {
    const data = new BehaviorSubject<Data>({ page: legalPage });

    await TestBed.configureTestingModule({
      imports: [InfoPageComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { data, snapshot: { data: { page: legalPage } } },
        },
        {
          provide: FrontendApiService,
          useValue: { infoPages: () => of([]) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(InfoPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Legal Notice',
    );

    data.next({ page: privacyPage });
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Privacy Policy');
    expect(element.querySelector('article')?.textContent).toContain('Privacy content');
    expect(TestBed.inject(Title).getTitle()).toBe('Privacy Policy — Personal Tech Radar');
  });
});
