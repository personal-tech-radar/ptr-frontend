import { safeReturnUrl } from './auth.guard';

describe('safeReturnUrl', () => {
  it('accepts local paths and rejects external redirects', () => {
    expect(safeReturnUrl('/signals/123')).toBe('/signals/123');
    expect(safeReturnUrl('//example.com')).toBe('/radar');
    expect(safeReturnUrl('https://example.com')).toBe('/radar');
  });
});
