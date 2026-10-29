// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { shouldReloadForNewVersion } from './staleBuild';

describe('shouldReloadForNewVersion', () => {
  beforeEach(() => sessionStorage.clear());

  it('reloads the first time a module from an older deploy fails to load', () => {
    // Given / When / Then
    expect(shouldReloadForNewVersion(sessionStorage, Date.now())).toBe(true);
  });

  it('does not reload again within ten seconds, so a missing file cannot cause a reload loop', () => {
    // Given
    const now = Date.now();
    shouldReloadForNewVersion(sessionStorage, now);

    // When / Then
    expect(shouldReloadForNewVersion(sessionStorage, now + 9_999)).toBe(false);
  });

  it('reloads again once ten seconds have passed', () => {
    // Given
    const now = Date.now();
    shouldReloadForNewVersion(sessionStorage, now);

    // When / Then
    expect(shouldReloadForNewVersion(sessionStorage, now + 10_000)).toBe(true);
  });
});
