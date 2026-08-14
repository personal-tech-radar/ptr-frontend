import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-date-navigation',
  templateUrl: './date-navigation.component.html',
  styleUrl: './date-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateNavigationComponent {
  readonly labels = input.required<string[]>();
  readonly active = input(0);
  readonly disabled = input(false);
  readonly selected = output<number>();
}
