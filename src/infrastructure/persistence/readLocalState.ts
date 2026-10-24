import { RemoteState, StateKey } from '../../application/ports/repositories';

const STORAGE_KEYS: Record<StateKey, string> = {
  applications: 'resume-applications',
  drafts: 'resume-application-drafts',
  stages: 'resume-stages',
  profile: 'resume-identity-attributes',
};

export const readLocalState = (storage: Storage): RemoteState =>
  Object.fromEntries(
    Object.entries(STORAGE_KEYS).flatMap(([key, storageKey]) => {
      const stored = storage.getItem(storageKey);
      return stored ? [[key, JSON.parse(stored)]] : [];
    }),
  );
