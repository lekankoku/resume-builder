const RELOADED_AT = 'reloadedForNewVersionAt';
const MIN_INTERVAL_MS = 10_000;

export const shouldReloadForNewVersion = (storage: Storage, now: number): boolean => {
  if (now - Number(storage.getItem(RELOADED_AT) ?? 0) < MIN_INTERVAL_MS) return false;
  storage.setItem(RELOADED_AT, String(now));
  return true;
};
