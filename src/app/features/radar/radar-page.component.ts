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
import { SignalItem } from '../../core/models/api.models';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';
import { SignalCardComponent } from '../../shared/components/signal-card/signal-card.component';
import { DateNavigationComponent } from '../../shared/components/date-navigation/date-navigation.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';
import { HeaderComponent } from '../../shared/layout/header/header.component';

@Component({
  selector: 'app-radar-page',
  imports: [
    FeedSkeletonComponent,
    SignalCardComponent,
    DateNavigationComponent,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './radar-page.component.html',
  styleUrl: './radar-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarPageComponent {
  private readonly api = inject(FrontendApiService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly signals = signal<SignalItem[]>([]);
  readonly pending = signal<string | null>(null);
  readonly groups = computed(() => {
    const grouped = new Map<string, SignalItem[]>();
    for (const item of this.signals()) {
      const name = item.materialType ?? 'Signals';
      grouped.set(name, [...(grouped.get(name) ?? []), item]);
    }
    return [...grouped.entries()].map(([name, items]) => ({ name, items }));
  });
  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (browser) this.load();
    });
  }
  load(): void {
    this.loading.set(true);
    this.api.radar().subscribe({
      next: (r) => {
        this.signals.set((r.days ?? []).flatMap((d) => d.articles));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Your radar could not be loaded. Try again shortly.');
        this.loading.set(false);
      },
    });
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
