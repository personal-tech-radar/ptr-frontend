import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../core/auth/auth-session.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly actionLabel = input<string>();
  readonly actionLink = input('/');
  readonly authenticated = input(false);
  readonly authenticatedActionLabel = input('Adjust the radar');
  readonly authenticatedActionLink = input('/profile');
  private readonly router = inject(Router);
  protected readonly session = inject(AuthSessionService);

  protected logout(): void {
    this.session.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
