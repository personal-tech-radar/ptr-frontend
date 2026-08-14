import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaxonomyItem, TaxonomyKind } from '../../../core/models/api.models';

@Component({
  selector: 'app-taxonomy-selector',
  imports: [FormsModule],
  templateUrl: './taxonomy-selector.component.html',
  styleUrl: './taxonomy-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomySelectorComponent {
  readonly label = input.required<string>();
  readonly kind = input.required<TaxonomyKind>();
  readonly items = input<TaxonomyItem[]>([]);
  readonly selected = input<TaxonomyItem[]>([]);
  readonly max = input(5);
  readonly loading = input(false);
  readonly selectedChange = output<TaxonomyItem[]>();
  readonly searchQuery = output<string>();
  readonly open = signal(false);
  readonly query = signal('');
  readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');
  toggle(): void {
    this.open.update((v) => !v);
    if (this.open()) setTimeout(() => this.searchBox()?.nativeElement.focus());
  }
  choose(item: TaxonomyItem): void {
    const current = this.selected();
    const exists = current.some((v) => v.name.toLowerCase() === item.name.toLowerCase());
    if (exists) this.selectedChange.emit(current.filter((v) => v.name !== item.name));
    else if (current.length < this.max()) this.selectedChange.emit([...current, item]);
  }
  create(): void {
    const name = this.query().trim();
    if (!name || this.selected().length >= this.max()) return;
    this.choose({ id: `custom:${name}`, kind: this.kind(), name, aliases: [] });
    this.query.set('');
  }
  hasExact(): boolean {
    return [...this.items(), ...this.selected()].some(
      (v) => v.name.toLowerCase() === this.query().trim().toLowerCase(),
    );
  }
  update(value: string): void {
    this.query.set(value);
    this.searchQuery.emit(value);
  }
  @HostListener('document:keydown.escape') close(): void {
    this.open.set(false);
  }
}
