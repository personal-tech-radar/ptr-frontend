import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FrontendApiService, publicToSignal } from '../../core/api/frontend-api.service';
import { PublicFilterOption, PublicSignal, SignalItem } from '../../core/models/api.models';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import {
  DateNavigationComponent,
  buildRecentDateLabels,
} from '../../shared/components/date-navigation/date-navigation.component';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';
import { IdeFilterPopupComponent } from '../../shared/components/ide-filter-popup/ide-filter-popup.component';
import { SignalCardComponent } from '../../shared/components/signal-card/signal-card.component';

type FilterName = 'technology' | 'interest' | 'stream' | 'date';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    SignalCardComponent,
    DateNavigationComponent,
    FeedSkeletonComponent,
    IdeFilterPopupComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly api = inject(FrontendApiService);
  private readonly router = inject(Router);
  private readonly publicSignals = new Map<string, PublicSignal>();
  private previewRequestId = 0;
  readonly auth = inject(AuthSessionService);
  readonly signals = signal<SignalItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly email = signal('');
  readonly openFilter = signal<FilterName | null>(null);
  readonly technologies = signal<PublicFilterOption[]>([]);
  readonly interests = signal<PublicFilterOption[]>([]);
  readonly streams = signal<PublicFilterOption[]>([]);
  readonly selectedTechnologyIds = signal<string[]>([]);
  readonly selectedInterestIds = signal<string[]>([]);
  readonly selectedStreamIds = signal<string[]>([]);
  readonly dateOptions: PublicFilterOption[] = [{ id: 'today', name: 'Today' }];
  readonly selectedDateIds = signal(['today']);
  readonly timelineLabels = buildRecentDateLabels();
  readonly groups = computed(() => {
    const grouped = new Map<string, SignalItem[]>();
    for (const stream of this.streams()) grouped.set(stream.name, []);
    for (const item of this.signals()) {
      const name = item.streamName ?? 'Signals';
      grouped.set(name, [...(grouped.get(name) ?? []), item]);
    }
    return [...grouped.entries()]
      .filter(([, items]) => items.length)
      .map(([name, items]) => ({ name, items }));
  });

  constructor() {
    this.api.publicFeed().subscribe({
      next: (response) => {
        response.data.forEach((item) => this.publicSignals.set(item.articleId ?? item.id, item));
        this.technologies.set(this.unique(response.data.flatMap((item) => item.technologies)));
        this.interests.set(this.unique(response.data.flatMap((item) => item.interests)));
        this.streams.set(
          this.unique(
            response.data.flatMap((item) =>
              item.primaryStream ? [item.primaryStream, ...item.streams] : item.streams,
            ),
          ),
        );
        this.selectedTechnologyIds.set(
          this.technologies()
            .slice(0, 4)
            .map((item) => item.id),
        );
        this.selectedInterestIds.set(
          this.interests()
            .slice(0, 3)
            .map((item) => item.id),
        );
        this.selectedStreamIds.set(this.streams().map((item) => item.id));
        this.signals.set(response.data.map(publicToSignal));
        this.loadPreview();
      },
      error: () => {
        this.error.set('No signals match your current filters.');
        this.loading.set(false);
      },
    });
  }

  toggleOpen(filter: FilterName): void {
    this.openFilter.update((current) => (current === filter ? null : filter));
  }

  toggleSelection(kind: Exclude<FilterName, 'date'>, id: string): void {
    const target =
      kind === 'technology'
        ? this.selectedTechnologyIds
        : kind === 'interest'
          ? this.selectedInterestIds
          : this.selectedStreamIds;
    target.update((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]));
    this.loadPreview();
  }

  selectedOptions(kind: Exclude<FilterName, 'date'>): PublicFilterOption[] {
    const options =
      kind === 'technology'
        ? this.technologies()
        : kind === 'interest'
          ? this.interests()
          : this.streams();
    const ids =
      kind === 'technology'
        ? this.selectedTechnologyIds()
        : kind === 'interest'
          ? this.selectedInterestIds()
          : this.selectedStreamIds();
    return options.filter((option) => ids.includes(option.id));
  }

  loadPreview(): void {
    if (!this.selectedStreamIds().length) {
      this.signals.set([]);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const requestId = ++this.previewRequestId;
    this.api
      .preview({
        technologyInterestIds: [...this.selectedTechnologyIds(), ...this.selectedInterestIds()],
        contentStreamIds: this.selectedStreamIds(),
      })
      .pipe(
        finalize(() => {
          if (requestId === this.previewRequestId) this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.previewRequestId) return;
          this.signals.set(
            response.data.map((item) => {
              const source = this.publicSignals.get(item.articleId);
              return {
                ...item,
                streamId: source?.primaryStream?.id ?? source?.streams[0]?.id ?? null,
                streamName: source?.primaryStream?.name ?? source?.streams[0]?.name ?? null,
              };
            }),
          );
        },
        error: () => {
          if (requestId === this.previewRequestId)
            this.error.set('No signals match your current filters.');
        },
      });
  }

  subscribe(value: string): void {
    if (this.auth.authenticated()) void this.router.navigate(['/radar']);
    else void this.router.navigate(['/register'], { queryParams: { email: value } });
  }

  private unique(items: PublicFilterOption[]): PublicFilterOption[] {
    return [...new Map(items.map((item) => [item.id, { id: item.id, name: item.name }])).values()];
  }
}
