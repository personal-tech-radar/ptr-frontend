import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, finalize, map, Subject, switchMap } from 'rxjs';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { ContentStream, TaxonomyItem, TaxonomyKind } from '../../core/models/api.models';
import { TaxonomySelectorComponent } from '../../shared/components/taxonomy-selector/taxonomy-selector.component';
import {
  FormSelectComponent,
  FormSelectOption,
} from '../../shared/components/form-select/form-select.component';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';

@Component({
  selector: 'app-onboarding-page',
  imports: [
    ReactiveFormsModule,
    TaxonomySelectorComponent,
    FormSelectComponent,
    HeaderComponent,
    FooterComponent,
  ],
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
  readonly step = signal(0);
  readonly steps = ['Profile', 'Technologies', 'Interests', 'Streams', 'Digest', 'Review'];
  readonly daily = signal(true);
  readonly weekly = signal(false);
  readonly experienceOptions: FormSelectOption[] = [
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Mid-level' },
    { value: 'senior', label: 'Senior' },
  ];
  readonly timezoneOptions: FormSelectOption[] = [
    'UTC',
    'Europe/Lisbon',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Warsaw',
    'Europe/Kyiv',
    'Asia/Dubai',
    'Asia/Tbilisi',
    'Asia/Bangkok',
    'Asia/Tokyo',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Australia/Sydney',
  ].map((value) => ({ value, label: value }));
  readonly form = this.fb.nonNullable.group({
    timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone, [Validators.required]],
    githubUrl: [''],
    level: ['middle' as 'junior' | 'middle' | 'senior', [Validators.required]],
    contentStreamIds: [[] as string[], [Validators.required]],
  });
  experienceHint(): string {
    return (
      {
        junior: 'Summaries include more context and terminology is spelled out.',
        middle: 'Balanced detail — the default for most engineers.',
        senior: 'Terse summaries, more weight on trade-offs and failure modes.',
      }[this.form.controls.level.value] ?? ''
    );
  }
  constructor() {
    afterNextRender(() => this.loadOptions());
    this.queries
      .pipe(
        debounceTime(200),
        switchMap((request) =>
          this.api
            .taxonomy(request.kind, request.q)
            .pipe(map((items) => ({ kind: request.kind, items }))),
        ),
      )
      .subscribe({
        next: ({ kind, items }) => {
          if (kind === 'interest') this.interestItems.set(items);
          else this.technologyItems.set(items);
        },
        error: () => this.error.set('No matches in the index.'),
      });
  }
  private loadOptions(): void {
    this.api
      .streams()
      .subscribe({ next: (value) => this.streams.set(value), error: () => undefined });
    this.api.taxonomy('technology').subscribe({
      next: (value) => this.technologyItems.set(value),
      error: () => undefined,
    });
    this.api.taxonomy('interest').subscribe({
      next: (value) => this.interestItems.set(value),
      error: () => undefined,
    });
  }
  search(kind: TaxonomyKind, q: string): void {
    this.queries.next({ kind, q });
  }
  next(): void {
    if (this.step() < this.steps.length - 1) this.step.update((value) => value + 1);
    else this.submit();
  }
  back(): void {
    this.step.update((value) => Math.max(0, value - 1));
  }
  stepMark(index: number): string {
    return index < this.step() ? '[x]' : index === this.step() ? '[>]' : '[ ]';
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
