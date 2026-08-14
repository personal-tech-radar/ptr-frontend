import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config';
import { PublicSignal } from '../../core/models/api.models';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';

@Component({
  selector: 'app-signal-page',
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './signal-page.component.html',
  styleUrl: './signal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalPageComponent {
  readonly auth = inject(AuthSessionService);
  private readonly api = inject(FrontendApiService);
  readonly pending = signal(false);
  readonly saved = signal(false);
  readonly saveConfirmed = signal(false);
  readonly feedback = signal<'useful' | 'not_useful' | null>(null);
  readonly signal = inject(ActivatedRoute).snapshot.data['signal'] as PublicSignal;
  readonly detailSummary = this.signal.longSummary ?? this.signal.summary ?? '';
  constructor() {
    afterNextRender(() => this.auth.restore().subscribe());
    const title = inject(Title),
      meta = inject(Meta);
    title.setTitle(`${this.signal.title} — Personal Tech Radar`);
    const description = (
      this.detailSummary || 'A public engineering signal from Personal Tech Radar'
    ).slice(0, 160);
    meta.updateTag({ name: 'description', content: description });
    meta.updateTag({ property: 'og:title', content: this.signal.title });
    meta.updateTag({ property: 'og:description', content: description });
    meta.updateTag({ property: 'og:type', content: 'article' });
    meta.updateTag({
      property: 'og:url',
      content: `${APP_CONFIG.siteUrl}/signals/${this.signal.id}`,
    });
  }
  sourceName(): string {
    const s = this.signal.source as { name?: string } | string | null;
    return typeof s === 'string' ? s : (s?.name ?? 'Independent source');
  }
  toggleSave(): void {
    if (this.pending()) return;
    this.pending.set(true);
    const request = this.saved() ? this.api.unsave(this.signal.id) : this.api.save(this.signal.id);
    const wasSaved = this.saved();
    request.subscribe({
      next: () => {
        this.saved.update((value) => !value);
        this.saveConfirmed.set(!wasSaved);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }
  saveLabel(): string {
    if (this.pending()) return this.saved() ? 'Removing…' : 'Saving…';
    if (this.saveConfirmed()) return 'Saved successfully';
    return this.saved() ? 'Remove from saved' : 'Save for later';
  }
  setFeedback(value: 'useful' | 'not_useful'): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.api.feedback(this.signal.articleId ?? this.signal.id, value).subscribe({
      next: () => {
        this.feedback.set(value);
        this.pending.set(false);
      },
      error: () => this.pending.set(false),
    });
  }
}
