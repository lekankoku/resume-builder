import { describe, expect, it, vi } from 'vitest';
import { fitToBudget } from './cvLength';

const pagesBy = (byDensity: Record<number, number>) => vi.fn(async (density: number) => byDensity[density]);

describe('fitToBudget', () => {
  it('keeps full size when the CV is within budget', async () => {
    const count = pagesBy({ 1: 2 });

    expect(await fitToBudget(count, 2)).toEqual({ density: 1, pages: 2, naturalPages: 2 });
    expect(count).toHaveBeenCalledTimes(1);
  });

  it('shrinks to the largest density that fits a one-page overflow', async () => {
    expect(await fitToBudget(pagesBy({ 1: 3, 0.977: 3, 0.955: 2 }), 2)).toEqual({ density: 0.955, pages: 2, naturalPages: 3 });
    expect(await fitToBudget(pagesBy({ 1: 3, 0.977: 2, 0.955: 2 }), 2)).toEqual({ density: 0.977, pages: 2, naturalPages: 3 });
  });

  it('keeps full size when shrinking does not reach the budget', async () => {
    expect(await fitToBudget(pagesBy({ 1: 3, 0.977: 3, 0.955: 3 }), 2)).toEqual({ density: 1, pages: 3, naturalPages: 3 });
  });

  it('does not try to shrink a CV that is more than one page over', async () => {
    const count = pagesBy({ 1: 4 });

    expect(await fitToBudget(count, 2)).toEqual({ density: 1, pages: 4, naturalPages: 4 });
    expect(count).toHaveBeenCalledTimes(1);
  });
});
