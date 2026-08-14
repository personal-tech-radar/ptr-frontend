import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicFilterOption } from '../../../core/models/api.models';

@Component({
  selector: 'app-ide-filter-popup',
  imports: [FormsModule],
  templateUrl: './ide-filter-popup.component.html',
  styleUrl: './ide-filter-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeFilterPopupComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly title = input.required<string>();
  readonly options = input.required<PublicFilterOption[]>();
  readonly selectedIds = input.required<string[]>();
  readonly searchable = input(true);
  readonly toggled = output<string>();
  readonly closed = output<void>();
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    afterNextRender(() => this.searchInput()?.nativeElement.focus());
  }

  filtered(): PublicFilterOption[] {
    const query = this.query().trim().toLocaleLowerCase();
    return query
      ? this.options().filter((option) => option.name.toLocaleLowerCase().includes(query))
      : this.options();
  }

  move(delta: number): void {
    const last = this.filtered().length - 1;
    this.activeIndex.update((value) => Math.max(0, Math.min(last, value + delta)));
  }

  chooseActive(): void {
    const option = this.filtered()[this.activeIndex()];
    if (option) this.toggled.emit(option.id);
  }

  @HostListener('keydown.escape', ['$event'])
  close(event: Event): void {
    event.stopPropagation();
    const trigger =
      this.host.nativeElement.parentElement?.querySelector<HTMLButtonElement>(':scope > button');
    this.closed.emit();
    trigger?.focus();
  }
}
