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
}

export function buildRecentDateLabels(now = new Date()): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    if (index === 6) return 'Today';
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (6 - index));
    return `${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} ${String(date.getUTCDate()).padStart(2, '0')}`;
  });
}
