import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
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
  readonly page = inject(ActivatedRoute).snapshot.data['page'] as InfoPage;
  readonly blocks = computed<InfoBlock[]>(() => {
    try {
      const document = JSON.parse(this.page.fullText) as { blocks?: InfoBlock[] };
      return (document.blocks ?? []).filter((block) => block.data?.text);
    } catch {
      return [{ type: 'paragraph', data: { text: this.page.fullText } }];
    }
  });

  constructor() {
    inject(Title).setTitle(`${this.page.title} — Personal Tech Radar`);
    inject(Meta).updateTag({
      name: 'description',
      content: `Read the Personal Tech Radar ${this.page.title}.`,
    });
  }
}
