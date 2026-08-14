import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, expand, finalize, forkJoin, map, reduce } from 'rxjs';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import {
  PipelineStatistics,
  PublicFilterOption,
  PublicSignal,
  SignalItem,
} from '../../core/models/api.models';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import {
  DateNavigationComponent,
  buildRecentDateLabels,
  buildRecentDates,
} from '../../shared/components/date-navigation/date-navigation.component';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';
import { IdeFilterPopupComponent } from '../../shared/components/ide-filter-popup/ide-filter-popup.component';
import { SignalCardComponent } from '../../shared/components/signal-card/signal-card.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';

type FilterName = 'technology' | 'interest' | 'stream' | 'date';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    SignalCardComponent,
    DateNavigationComponent,
    FeedSkeletonComponent,
    IdeFilterPopupComponent,
    FooterComponent,
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
  readonly dates = signal(buildRecentDates(new Date(), 30));
  readonly selectedDate = signal(this.dates()[29]);
  readonly timelineLabels = computed(() =>
    buildRecentDateLabels(new Date(`${this.dates()[29]}T12:00:00Z`), 30),
  );
  readonly dateOptions = computed<PublicFilterOption[]>(() =>
    [...this.dates()].reverse().map((id, index) => ({
      id,
      name:
        index === 0
          ? 'Today'
          : index === 1
            ? 'Yesterday'
            : new Date(`${id}T12:00:00Z`).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                timeZone: 'UTC',
              }),
    })),
  );
  readonly selectedDateIds = computed(() => [this.selectedDate()]);
  readonly selectedDateLabel = computed(
    () => this.dateOptions().find((option) => option.id === this.selectedDate())?.name ?? 'Today',
  );
  readonly statistics = signal<PipelineStatistics | null>(null);
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
    forkJoin({
      technologies: this.loadCatalog('technology'),
      interests: this.loadCatalog('interest'),
      streams: this.api.publicStreams(),
    }).subscribe({
      next: ({ technologies, interests, streams }) => {
        this.technologies.set(technologies.map(({ id, name }) => ({ id, name })));
        this.interests.set(interests.map(({ id, name }) => ({ id, name })));
        this.streams.set(streams.map(({ id, name }) => ({ id, name })));
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
        this.loadPreview();
      },
      error: () => {
        this.error.set('No signals match your current filters.');
        this.loading.set(false);
      },
    });
  }

  private loadCatalog(kind: 'technology' | 'interest') {
    return this.api.publicTaxonomy(kind).pipe(
      expand((response) =>
        response.meta.page < response.meta.totalPages
          ? this.api.publicTaxonomy(kind, response.meta.page + 1)
          : EMPTY,
      ),
      map((response) => response.data),
      reduce(
        (all, page) => [...all, ...page],
        [] as import('../../core/models/api.models').TaxonomyItem[],
      ),
    );
  }

  selectDate(id: string): void {
    this.selectedDate.set(id);
    this.openFilter.set(null);
    this.loadPreview();
  }

  moveDate(offset: number): void {
    const current = this.dates().indexOf(this.selectedDate());
    const next = Math.max(0, Math.min(this.dates().length - 1, current + offset));
    this.selectDate(this.dates()[next]);
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
    forkJoin({
      preview: this.api.preview({
        technologyInterestIds: [...this.selectedTechnologyIds(), ...this.selectedInterestIds()],
        contentStreamIds: this.selectedStreamIds(),
        dateFrom: this.selectedDate(),
        dateTo: this.selectedDate(),
      }),
      publicFeed: this.api.publicFeed({
        dateFrom: this.selectedDate(),
        dateTo: this.selectedDate(),
      }),
    })
      .pipe(
        finalize(() => {
          if (requestId === this.previewRequestId) this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({ preview, publicFeed }) => {
          if (requestId !== this.previewRequestId) return;
          this.publicSignals.clear();
          publicFeed.data.forEach((item) =>
            this.publicSignals.set(item.articleId ?? item.id, item),
          );
          this.signals.set(
            preview.data.map((item) => {
              const source = this.publicSignals.get(item.articleId);
              return {
                ...item,
                streamId: source?.primaryStream?.id ?? source?.streams[0]?.id ?? null,
                streamName: source?.primaryStream?.name ?? source?.streams[0]?.name ?? null,
              };
            }),
          );
          this.statistics.set(preview.meta);
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
}
