import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicFilterOption } from '../../../core/models/api.models';

@Component({
  selector: 'app-inline-option-selector',
  imports: [FormsModule],
  templateUrl: './inline-option-selector.component.html',
  styleUrl: './inline-option-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineOptionSelectorComponent {
  readonly label = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly searchable = input(true);
  readonly showSelectionSummary = input(true);
  readonly options = input<PublicFilterOption[]>([]);
  readonly selectedIds = input<string[]>([]);
  readonly toggled = output<string>();
  readonly query = signal('');
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return query
      ? this.options().filter((option) => option.name.toLowerCase().includes(query))
      : this.options();
  });
  selectedOptions(): PublicFilterOption[] {
    return this.options().filter((option) => this.selectedIds().includes(option.id));
  }
}
