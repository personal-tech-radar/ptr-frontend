import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FeedbackType, SignalItem } from '../../../core/models/api.models';

@Component({
  selector: 'app-signal-card',
  imports: [RouterLink],
  templateUrl: './signal-card.component.html',
  styleUrl: './signal-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalCardComponent {
  readonly signal = input.required<SignalItem>();
  readonly actions = input(false);
  readonly pending = input(false);
  readonly save = output<void>();
  readonly feedback = output<FeedbackType>();
}
