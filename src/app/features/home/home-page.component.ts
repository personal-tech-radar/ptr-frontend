import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FrontendApiService, publicToSignal } from '../../core/api/frontend-api.service';
import { SignalItem } from '../../core/models/api.models';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { DateNavigationComponent } from '../../shared/components/date-navigation/date-navigation.component';
import { FeedSkeletonComponent } from '../../shared/components/feed-skeleton/feed-skeleton.component';
import { SignalCardComponent } from '../../shared/components/signal-card/signal-card.component';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, SignalCardComponent, DateNavigationComponent, FeedSkeletonComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly api = inject(FrontendApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthSessionService);
  readonly signals = signal<SignalItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly email = signal('');
  readonly groups = computed(() => {
    const grouped = new Map<string, SignalItem[]>();
    for (const item of this.signals()) {
      const name = item.materialType ?? 'Signals';
      grouped.set(name, [...(grouped.get(name) ?? []), item]);
    }
    return [...grouped.entries()].map(([name, items]) => ({ name, items }));
  });
  constructor() {
    this.api.publicFeed().subscribe({
      next: (r) => {
        this.signals.set(r.data.map(publicToSignal));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No signals match your current filters.');
        this.loading.set(false);
      },
    });
  }
  subscribe(value: string): void {
    if (this.auth.authenticated()) void this.router.navigate(['/radar']);
    else void this.router.navigate(['/register'], { queryParams: { email: value } });
  }
}
