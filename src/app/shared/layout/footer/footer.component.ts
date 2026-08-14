import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, map, of, shareReplay } from 'rxjs';
import { FrontendApiService } from '../../../core/api/frontend-api.service';

@Component({
  selector: 'app-footer',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly divider = input(true);
  readonly pages$ = inject(FrontendApiService)
    .infoPages()
    .pipe(
      map((pages) => {
        const order = ['Legal Notice', 'Privacy Policy', 'Cookies Policy'];
        return pages
          .filter((page) => order.includes(page.title))
          .sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
      }),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
}
