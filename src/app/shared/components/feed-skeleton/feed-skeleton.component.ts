import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-feed-skeleton',
  templateUrl: './feed-skeleton.component.html',
  styleUrl: './feed-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedSkeletonComponent {}
