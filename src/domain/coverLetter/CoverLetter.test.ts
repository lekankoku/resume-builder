import { describe, expect, it } from 'vitest';
import { createCoverLetter, updateCoverLetterField } from './CoverLetter';

describe('CoverLetter', () => {
  it('starts empty and dated with the long US format', () => {
    expect(createCoverLetter(new Date(2026, 0, 6))).toEqual({
      recipientName: '',
      recipientTitle: '',
      companyAddress: '',
      date: 'January 6, 2026',
      body: '',
    });
  });

  it('updates a single field without mutating the original', () => {
    const letter = createCoverLetter(new Date(2026, 0, 6));
    const body = crypto.randomUUID();

    const updated = updateCoverLetterField(letter, 'body', body);

    expect(updated).toEqual({ ...letter, body });
    expect(letter.body).toBe('');
  });
});
