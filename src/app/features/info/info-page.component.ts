import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { map } from 'rxjs';
import { InfoPage } from '../../core/models/api.models';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { FooterComponent } from '../../shared/layout/footer/footer.component';

interface InfoBlock {
  type: 'heading' | 'paragraph';
  data: { level?: number; text: string };
}

@Component({
  selector: 'app-info-page',
  imports: [DatePipe, HeaderComponent, FooterComponent],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly page = toSignal(this.route.data.pipe(map((data) => data['page'] as InfoPage)), {
    initialValue: this.route.snapshot.data['page'] as InfoPage,
  });
  readonly blocks = computed<InfoBlock[]>(() => {
    const page = this.page();
    try {
      const document = JSON.parse(page.fullText) as { blocks?: InfoBlock[] };
      return (document.blocks ?? []).filter((block) => block.data?.text);
    } catch {
      return [{ type: 'paragraph', data: { text: page.fullText } }];
    }
  });

  constructor() {
    const title = inject(Title);
    const meta = inject(Meta);
    effect(() => {
      const page = this.page();
      title.setTitle(`${page.title} — Personal Tech Radar`);
      meta.updateTag({
        name: 'description',
        content: `Read the Personal Tech Radar ${page.title}.`,
      });
    });
  }
}
