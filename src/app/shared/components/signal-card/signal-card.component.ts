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
  readonly saveConfirmed = input(false);
  readonly save = output<void>();
  readonly feedback = output<FeedbackType>();

  saveLabel(): string {
    if (this.pending()) return this.signal().saved ? 'Removing…' : 'Saving…';
    if (this.saveConfirmed()) return 'Saved successfully';
    return this.signal().saved ? 'Remove from saved' : 'Save for later';
  }
}
