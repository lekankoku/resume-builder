import { describe, expect, it } from 'vitest';
import { formatUsd } from './cvGeneration';

describe('cvGeneration', () => {
  describe('formatUsd', () => {
    it.each([
      [0, '$0.00'],
      [0.004, '<$0.01'],
      [0.153, '$0.15'],
      [12.5, '$12.50'],
    ])('formats %d as %s', (usd, text) => {
      expect(formatUsd(usd)).toBe(text);
    });
  });
});
