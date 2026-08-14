import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, Subject, switchMap } from 'rxjs';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { ContentStream, TaxonomyItem, TaxonomyKind } from '../../core/models/api.models';
import { TaxonomySelectorComponent } from '../../shared/components/taxonomy-selector/taxonomy-selector.component';

@Component({
  selector: 'app-onboarding-page',
  imports: [ReactiveFormsModule, TaxonomySelectorComponent],
  templateUrl: './onboarding-page.component.html',
  styleUrl: './onboarding-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FrontendApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly queries = new Subject<{ kind: TaxonomyKind; q: string }>();
  readonly streams = signal<ContentStream[]>([]);
  readonly technologyItems = signal<TaxonomyItem[]>([]);
  readonly interestItems = signal<TaxonomyItem[]>([]);
  readonly technologies = signal<TaxonomyItem[]>([]);
  readonly interests = signal<TaxonomyItem[]>([]);
  readonly pending = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone, [Validators.required]],
    githubUrl: [''],
    level: ['middle' as 'junior' | 'middle' | 'senior', [Validators.required]],
    contentStreamIds: [[] as string[], [Validators.required]],
  });
  constructor() {
    this.api.streams().subscribe((v) => this.streams.set(v));
    this.api.taxonomy('technology').subscribe((v) => this.technologyItems.set(v));
    this.api.taxonomy('interest').subscribe((v) => this.interestItems.set(v));
    this.queries
      .pipe(
        debounceTime(200),
        switchMap((v) => this.api.taxonomy(v.kind, v.q)),
      )
      .subscribe((items) => {
        const kind = items[0]?.kind;
        if (kind === 'interest') this.interestItems.set(items);
        else this.technologyItems.set(items);
      });
  }
  search(kind: TaxonomyKind, q: string): void {
    this.queries.next({ kind, q });
  }
  toggleStream(id: string): void {
    const c = this.form.controls.contentStreamIds;
    const values = c.value;
    c.setValue(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  }
  submit(): void {
    if (this.form.invalid || !this.technologies().length || !this.interests().length) {
      this.error.set('Choose at least one stream, technology and interest.');
      return;
    }
    this.pending.set(true);
    const v = this.form.getRawValue();
    this.api
      .onboarding({
        ...v,
        githubUrl: v.githubUrl || null,
        technologyInterests: [...this.technologies(), ...this.interests()].map((x) => ({
          kind: x.kind,
          name: x.name,
        })),
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (user) => {
          this.auth.updateUser(user);
          void this.router.navigate(['/radar']);
        },
        error: () => this.error.set('We could not save your radar setup.'),
      });
  }
}
