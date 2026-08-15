import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-date-navigation',
  templateUrl: './date-navigation.component.html',
  styleUrl: './date-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateNavigationComponent {
  readonly labels = input(buildRecentDateLabels());
  readonly active = input(0);
  readonly disabled = input(false);
  readonly selected = output<number>();
  readonly previous = output<void>();
  readonly next = output<void>();
}

export function buildRecentDates(now = new Date(), length = 7): string[] {
  return Array.from({ length }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (length - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

export function buildRecentDateLabels(now = new Date(), length = 7): string[] {
  return Array.from({ length }, (_, index) => {
    if (index === length - 1) return 'Today';
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (length - 1 - index));
    return `${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} ${String(date.getUTCDate()).padStart(2, '0')}`;
  });
}
