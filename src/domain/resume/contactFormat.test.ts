import { describe, expect, it } from 'vitest';
import { cleanPhone, cleanUrl, displayUrl } from './contactFormat';

describe('contactFormat', () => {
  describe('cleanUrl', () => {
    it('unwraps markdown links', () => {
      expect(cleanUrl('[my site](https://example.com/me)')).toBe('https://example.com/me');
    });

    it('trims plain urls', () => {
      expect(cleanUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('returns an empty string for empty input', () => {
      expect(cleanUrl('')).toBe('');
    });
  });

  describe('cleanPhone', () => {
    it('keeps digits and the leading plus only', () => {
      expect(cleanPhone('+49 (176) 879-22820')).toBe('+4917687922820');
    });

    it('returns an empty string for empty input', () => {
      expect(cleanPhone('')).toBe('');
    });
  });

  describe('displayUrl', () => {
    it('strips protocol, www and trailing slash', () => {
      expect(displayUrl('https://www.linkedin.com/in/someone/')).toBe('linkedin.com/in/someone');
    });

    it('strips markdown wrapping before formatting', () => {
      expect(displayUrl('[x](http://example.com/)')).toBe('example.com');
    });

    it('returns an empty string for empty input', () => {
      expect(displayUrl('')).toBe('');
    });
  });
});
