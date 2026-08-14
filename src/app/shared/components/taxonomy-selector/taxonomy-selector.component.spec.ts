import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaxonomySelectorComponent } from './taxonomy-selector.component';

describe('TaxonomySelectorComponent', () => {
  let fixture: ComponentFixture<TaxonomySelectorComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxonomySelectorComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TaxonomySelectorComponent);
    fixture.componentRef.setInput('label', 'Technologies');
    fixture.componentRef.setInput('kind', 'technology');
    fixture.detectChanges();
  });
  it('creates a custom taxonomy item from a new query', () => {
    const selected: unknown[] = [];
    fixture.componentInstance.selectedChange.subscribe((value) => selected.push(value));
    fixture.componentInstance.query.set('Angular');
    fixture.componentInstance.create();
    expect(selected).toEqual([[expect.objectContaining({ name: 'Angular', kind: 'technology' })]]);
  });
  it('does not create a sixth item', () => {
    fixture.componentRef.setInput(
      'selected',
      Array.from({ length: 5 }, (_, id) => ({
        id: String(id),
        kind: 'technology',
        name: `Item ${id}`,
        aliases: [],
      })),
    );
    let emitted = false;
    fixture.componentInstance.selectedChange.subscribe(() => (emitted = true));
    fixture.componentInstance.query.set('Sixth');
    fixture.componentInstance.create();
    expect(emitted).toBe(false);
  });
});
