import { describe, expect, it } from 'vitest';
import { EMPTY_PERIOD, formatPeriod, isEmptyPeriod, parsePeriod, periodError } from './period';

const today = new Date(2026, 9, 25);

describe('period', () => {
  describe('parsePeriod', () => {
    it('parses a closed period into its parts', () => {
      // Given / When
      const draft = parsePeriod('December 2023 - January 2026');

      // Then
      expect(draft).toEqual({ startMonth: 'December', startYear: '2023', endMonth: 'January', endYear: '2026', current: false });
    });

    it('parses an ongoing period as current', () => {
      // Given / When
      const draft = parsePeriod('March 2021 - Present');

      // Then
      expect(draft).toEqual({ ...EMPTY_PERIOD, startMonth: 'March', startYear: '2021', current: true });
    });

    it('parses the en dash separator used in saved data', () => {
      // Given / When
      const draft = parsePeriod('October 2022 – October 2023');

      // Then
      expect(draft).toEqual({ startMonth: 'October', startYear: '2022', endMonth: 'October', endYear: '2023', current: false });
    });

    it('expands abbreviated months and accepts any casing of present', () => {
      // Given / When
      const draft = parsePeriod('jun 2026 – PRESENT');

      // Then
      expect(draft).toEqual({ ...EMPTY_PERIOD, startMonth: 'June', startYear: '2026', current: true });
    });

    it.each(['', '2026 – Present', 'Smarch 2019 - March 2023', 'Ma 2019 - March 2023', 'March 2019', 'March 2019 - soon', 'May 2019 - May 2020 - May 2021'])(
      'returns an empty draft for unrecognised text "%s"',
      (text) => {
        // Given / When
        const draft = parsePeriod(text);

        // Then
        expect(draft).toEqual(EMPTY_PERIOD);
      },
    );
  });

  describe('formatPeriod', () => {
    it('formats a closed period', () => {
      // Given
      const draft = { startMonth: 'June', startYear: '2020', endMonth: 'October', endYear: '2021', current: false };

      // When / Then
      expect(formatPeriod(draft)).toBe('June 2020 – October 2021');
    });

    it('formats a current period with Present and ignores any end date', () => {
      // Given
      const draft = { startMonth: 'June', startYear: '2020', endMonth: 'October', endYear: '2021', current: true };

      // When / Then
      expect(formatPeriod(draft)).toBe('June 2020 – Present');
    });

    it('round-trips through parsePeriod', () => {
      // Given
      const text = 'May 2019 – December 2020';

      // When / Then
      expect(formatPeriod(parsePeriod(text))).toBe(text);
    });
  });

  describe('isEmptyPeriod', () => {
    it('is true when nothing is filled in', () => {
      expect(isEmptyPeriod(EMPTY_PERIOD)).toBe(true);
    });

    it('is false once the present box is ticked', () => {
      expect(isEmptyPeriod({ ...EMPTY_PERIOD, current: true })).toBe(false);
    });

    it('is false once any field is filled in', () => {
      expect(isEmptyPeriod({ ...EMPTY_PERIOD, endYear: '2020' })).toBe(false);
    });
  });

  describe('periodError', () => {
    const valid = { startMonth: 'June', startYear: '2020', endMonth: 'October', endYear: '2021', current: false };

    it('accepts a valid closed period', () => {
      expect(periodError(valid, today)).toBeNull();
    });

    it('accepts a current period without an end date', () => {
      expect(periodError({ ...EMPTY_PERIOD, startMonth: 'June', startYear: '2020', current: true }, today)).toBeNull();
    });

    it('accepts an end month equal to the start month', () => {
      expect(periodError({ ...valid, endMonth: 'June', endYear: '2020' }, today)).toBeNull();
    });

    it.each([
      { startMonth: '', startYear: '2020' },
      { startMonth: 'June', startYear: '' },
      { startMonth: 'June', startYear: '20' },
    ])('rejects an incomplete start date %o', (start) => {
      expect(periodError({ ...valid, ...start }, today)).toBe('Enter a valid start month and year');
    });

    it('rejects a start date in the future', () => {
      expect(periodError({ ...valid, startMonth: 'November', startYear: '2026', current: true }, today)).toBe(
        'Start date cannot be in the future',
      );
    });

    it('accepts a start date in the current month', () => {
      expect(periodError({ ...EMPTY_PERIOD, startMonth: 'October', startYear: '2026', current: true }, today)).toBeNull();
    });

    it('rejects a missing end date when not current', () => {
      expect(periodError({ ...valid, endMonth: '', endYear: '' }, today)).toBe('Enter a valid end month and year, or tick present');
    });

    it('rejects an end date before the start date', () => {
      expect(periodError({ ...valid, endMonth: 'May', endYear: '2020' }, today)).toBe('End date cannot be before start date');
    });
  });
});
