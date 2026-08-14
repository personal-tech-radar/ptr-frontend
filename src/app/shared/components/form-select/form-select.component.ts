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

export interface FormSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-form-select',
  imports: [FormsModule],
  templateUrl: './form-select.component.html',
  styleUrl: './form-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSelectComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly options = input.required<FormSelectOption[]>();
  readonly searchable = input(false);
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly query = signal('');
  readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  selectedLabel(): string {
    return this.options().find((option) => option.value === this.value())?.label ?? this.value();
  }

  filtered(): FormSelectOption[] {
    const query = this.query().trim().toLocaleLowerCase();
    return query
      ? this.options().filter((option) => option.label.toLocaleLowerCase().includes(query))
      : this.options();
  }

  select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
    this.trigger()?.nativeElement.focus();
  }

  @HostListener('keydown.escape')
  close(): void {
    this.open.set(false);
    this.trigger()?.nativeElement.focus();
  }
}
