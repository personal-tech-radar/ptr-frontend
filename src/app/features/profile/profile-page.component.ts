import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap } from 'rxjs';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { ContentStream, ExperienceLevel, TaxonomyItem } from '../../core/models/api.models';
import { TaxonomySelectorComponent } from '../../shared/components/taxonomy-selector/taxonomy-selector.component';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, TaxonomySelectorComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FrontendApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  readonly pending = signal(false);
  readonly notice = signal('');
  readonly tab = signal<'profile' | 'password' | 'danger'>('profile');
  readonly streams = signal<ContentStream[]>([]);
  readonly technologyItems = signal<TaxonomyItem[]>([]);
  readonly interestItems = signal<TaxonomyItem[]>([]);
  readonly technologies = signal<TaxonomyItem[]>([]);
  readonly interests = signal<TaxonomyItem[]>([]);
  readonly selectedStreamIds = signal<string[]>([]);
  readonly profile = this.fb.nonNullable.group({
    displayName: ['', [Validators.required]],
    githubUrl: [''],
    timezone: [''],
    level: ['middle' satisfies ExperienceLevel],
    dailyDigestEnabled: [false],
    weeklyDigestEnabled: [false],
  });
  readonly password = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });
  constructor() {
    this.api.me().subscribe((u) => {
      this.auth.updateUser(u);
      this.profile.patchValue({
        displayName: u.displayName,
        githubUrl: u.githubUrl ?? '',
        timezone: u.timezone ?? '',
        level: u.level ?? 'middle',
        dailyDigestEnabled: u.dailyDigestEnabled,
        weeklyDigestEnabled: u.weeklyDigestEnabled,
      });
    });
    forkJoin({
      streams: this.api.streams(),
      taxonomy: this.api.userTaxonomy(),
      technologies: this.api.taxonomy('technology'),
      interests: this.api.taxonomy('interest'),
    }).subscribe(({ streams, taxonomy, technologies, interests }) => {
      this.streams.set(streams);
      this.technologies.set(taxonomy.technologyInterests.filter((v) => v.kind === 'technology'));
      this.interests.set(taxonomy.technologyInterests.filter((v) => v.kind === 'interest'));
      this.selectedStreamIds.set(taxonomy.contentStreams.map((v) => v.id));
      this.technologyItems.set(technologies);
      this.interestItems.set(interests);
    });
  }
  toggleStream(id: string): void {
    this.selectedStreamIds.update((values) =>
      values.includes(id) ? values.filter((value) => value !== id) : [...values, id],
    );
  }
  search(kind: 'technology' | 'interest', query: string): void {
    this.api
      .taxonomy(kind, query)
      .subscribe((items) =>
        kind === 'technology' ? this.technologyItems.set(items) : this.interestItems.set(items),
      );
  }
  save(): void {
    if (this.profile.invalid) return;
    this.pending.set(true);
    const v = this.profile.getRawValue();
    this.api
      .updateMe({ ...v, level: v.level as ExperienceLevel, githubUrl: v.githubUrl || null })
      .pipe(
        switchMap((user) =>
          this.api
            .onboarding({
              timezone: v.timezone,
              githubUrl: v.githubUrl || null,
              level: v.level as ExperienceLevel,
              contentStreamIds: this.selectedStreamIds(),
              technologyInterests: [...this.technologies(), ...this.interests()].map((item) => ({
                kind: item.kind,
                name: item.name,
              })),
            })
            .pipe(map(() => user)),
        ),
        finalize(() => this.pending.set(false)),
      )
      .subscribe({
        next: (u) => {
          this.auth.updateUser(u);
          this.notice.set('Profile saved.');
        },
        error: () => this.notice.set('Profile could not be saved.'),
      });
  }
  changePassword(): void {
    if (this.password.invalid) return;
    this.pending.set(true);
    const v = this.password.getRawValue();
    this.api
      .changePassword(v.currentPassword, v.newPassword)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.password.reset();
          this.notice.set('Password changed.');
        },
        error: () => this.notice.set('Password could not be changed.'),
      });
  }
  deleteAccount(): void {
    if (!globalThis.confirm?.('Permanently delete your account? This cannot be undone.')) return;
    this.api.deleteMe().subscribe({
      next: () => {
        this.auth.clear();
        void this.router.navigate(['/']);
      },
      error: () => this.notice.set('Account deletion failed.'),
    });
  }
}
