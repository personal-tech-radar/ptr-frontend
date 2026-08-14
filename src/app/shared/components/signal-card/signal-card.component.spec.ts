import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { SignalItem } from '../../../core/models/api.models';
import { SignalCardComponent } from './signal-card.component';

const signal: SignalItem = {
  articleId: 'signal-1',
  title: 'Signal title',
  url: 'https://example.com',
  sourceName: 'Source',
  publishedAt: '2026-08-14T12:00:00Z',
  shortSummary: 'Summary',
  complexityLevel: 'intermediate',
  materialType: 'article',
  saved: false,
};

describe('SignalCardComponent', () => {
  it('announces a successful save and keeps the saved pressed state', async () => {
    await TestBed.configureTestingModule({
      imports: [SignalCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SignalCardComponent);
    fixture.componentRef.setInput('signal', { ...signal, saved: true });
    fixture.componentRef.setInput('actions', true);
    fixture.componentRef.setInput('saveConfirmed', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = element.querySelectorAll<HTMLButtonElement>('button');
    const saveButton = buttons.item(buttons.length - 1);
    expect(saveButton.textContent).toContain('Saved successfully');
    expect(saveButton.getAttribute('aria-pressed')).toBe('true');
    expect(saveButton.getAttribute('aria-live')).toBe('polite');
  });
});
