import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { PublicFilterOption, SignalItem } from '../../core/models/api.models';
import { catchError, forkJoin, of } from 'rxjs';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';
import { SignalCardComponent } from '../../shared/components/signal-card/signal-card.component';
import {
  DateNavigationComponent,
  buildRecentDateLabels,
  buildRecentDates,
} from '../../shared/components/date-navigation/date-navigation.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { IdeFilterPopupComponent } from '../../shared/components/ide-filter-popup/ide-filter-popup.component';

@Component({
  selector: 'app-radar-page',
  imports: [
    FeedSkeletonComponent,
    SignalCardComponent,
    DateNavigationComponent,
    HeaderComponent,
    FooterComponent,
    IdeFilterPopupComponent,
  ],
  templateUrl: './radar-page.component.html',
  styleUrl: './radar-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarPageComponent {
  private readonly api = inject(FrontendApiService);
  private readonly streamByArticle = new Map<string, { id: string; name: string } | undefined>();
  readonly loading = signal(true);
  readonly error = signal('');
  readonly signals = signal<SignalItem[]>([]);
  readonly pending = signal<string | null>(null);
  readonly technologyOptions = signal<PublicFilterOption[]>([]);
  readonly interestOptions = signal<PublicFilterOption[]>([]);
  readonly streamOptions = signal<PublicFilterOption[]>([]);
  readonly selectedTechnologyIds = signal<string[]>([]);
  readonly selectedInterestIds = signal<string[]>([]);
  readonly selectedStreamKeys = signal<string[]>([]);
  readonly savedOnly = signal(false);
  readonly openFilter = signal<'date' | null>(null);
  readonly dates = signal(buildRecentDates(new Date(), 30));
  readonly selectedDate = signal(this.dates()[29]);
  readonly timelineLabels = computed(() =>
    buildRecentDateLabels(new Date(`${this.dates()[29]}T12:00:00Z`), 30),
  );
  readonly dateOptions = computed(() =>
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
  readonly savedCount = computed(() => this.signals().filter((item) => item.saved).length);
  readonly groups = computed(() => {
    const grouped = new Map<string, SignalItem[]>();
    for (const item of this.signals()) {
      const name = item.streamName ?? item.materialType ?? 'Signals';
      grouped.set(name, [...(grouped.get(name) ?? []), item]);
    }
    return [...grouped.entries()].map(([name, items]) => ({ name, items }));
  });
  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (browser) this.initialize();
    });
  }
  initialize(): void {
    forkJoin({
      taxonomy: this.api.userTaxonomy(),
      streams: this.api.streams(),
    }).subscribe({
      next: ({ taxonomy, streams }) => {
        const technologies = taxonomy.technologyInterests.filter(
          (item) => item.kind === 'technology',
        );
        const interests = taxonomy.technologyInterests.filter((item) => item.kind === 'interest');
        this.technologyOptions.set(technologies.map(({ id, name }) => ({ id, name })));
        this.interestOptions.set(interests.map(({ id, name }) => ({ id, name })));
        this.streamOptions.set(streams.map(({ key, name }) => ({ id: key, name })));
        this.selectedTechnologyIds.set(technologies.map((item) => item.id));
        this.selectedInterestIds.set(interests.map((item) => item.id));
        this.selectedStreamKeys.set(taxonomy.contentStreams.map((stream) => stream.key));
        this.load(true);
      },
      error: () => this.load(),
    });
  }
  load(initial = false): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      feed: this.api.radar(
        this.savedOnly()
          ? { saved: true, dateFrom: this.selectedDate(), dateTo: this.selectedDate() }
          : initial
            ? { dateFrom: this.selectedDate(), dateTo: this.selectedDate() }
            : {
                stream: this.selectedStreamKeys(),
                technology: this.selectedTechnologyIds(),
                interest: this.selectedInterestIds(),
                dateFrom: this.selectedDate(),
                dateTo: this.selectedDate(),
              },
      ),
      publicFeed: this.api
        .publicFeed({ dateFrom: this.selectedDate(), dateTo: this.selectedDate() })
        .pipe(
          catchError(() =>
            of({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 0 } }),
          ),
        ),
    }).subscribe({
      next: ({ feed, publicFeed }) => {
        publicFeed.data.forEach((signal) =>
          this.streamByArticle.set(
            signal.articleId ?? signal.id,
            signal.primaryStream ?? signal.streams[0],
          ),
        );
        this.signals.set(
          (feed.days ?? [])
            .flatMap((d) => d.articles)
            .map((item) => {
              const stream = this.streamByArticle.get(item.articleId);
              return stream ? { ...item, streamId: stream.id, streamName: stream.name } : item;
            }),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Your radar could not be loaded. Try again shortly.');
        this.loading.set(false);
      },
    });
  }
  toggleAll(kind: 'technology' | 'interest'): void {
    const target = kind === 'technology' ? this.selectedTechnologyIds : this.selectedInterestIds;
    const options = kind === 'technology' ? this.technologyOptions() : this.interestOptions();
    target.set(target().length ? [] : options.map((option) => option.id));
    this.savedOnly.set(false);
    this.load();
  }
  selectDate(index: number): void {
    this.selectedDate.set(this.dates()[index]);
    this.openFilter.set(null);
    this.load();
  }
  selectDateValue(id: string): void {
    const index = this.dates().indexOf(id);
    if (index >= 0) this.selectDate(index);
  }
  moveDate(offset: number): void {
    const current = this.dates().indexOf(this.selectedDate());
    this.selectDate(Math.max(0, Math.min(this.dates().length - 1, current + offset)));
  }
  toggleFilter(kind: 'technology' | 'interest' | 'stream', id: string): void {
    const target =
      kind === 'technology'
        ? this.selectedTechnologyIds
        : kind === 'interest'
          ? this.selectedInterestIds
          : this.selectedStreamKeys;
    target.update((values) =>
      values.includes(id) ? values.filter((value) => value !== id) : [...values, id],
    );
    this.savedOnly.set(false);
    this.load();
  }
  toggleSavedOnly(): void {
    this.savedOnly.update((value) => !value);
    this.load();
  }
  save(item: SignalItem): void {
    if (this.pending()) return;
    this.pending.set(item.articleId);
    const request = item.saved ? this.api.unsave(item.articleId) : this.api.save(item.articleId);
    request.subscribe({
      next: () => {
        this.signals.update((all) =>
          all.map((v) => (v.articleId === item.articleId ? { ...v, saved: !v.saved } : v)),
        );
        this.pending.set(null);
      },
      error: () => this.pending.set(null),
    });
  }
  feedback(item: SignalItem, value: 'useful' | 'not_useful'): void {
    if (this.pending()) return;
    this.pending.set(item.articleId);
    this.api.feedback(item.articleId, value).subscribe({
      next: () => {
        this.signals.update((all) =>
          all.map((v) => (v.articleId === item.articleId ? { ...v, feedback: value } : v)),
        );
        this.pending.set(null);
      },
      error: () => this.pending.set(null),
    });
  }
}
