import {
  RemoteState,
  Repositories,
  SaveStatus,
  SaveStatusSource,
  StateClient,
  StateKey,
} from '../../application/ports/repositories';
import { DEFAULT_STAGES } from '../../domain/application/stages';
import { Profile } from '../../domain/resume/Resume';

export const createRemoteRepositories = (
  state: RemoteState,
  client: StateClient,
  defaultProfile: Profile,
  delayMs = 1000,
) => {
  const snapshot: RemoteState = { ...state };
  const timers = new Map<StateKey, ReturnType<typeof setTimeout>>();
  const queues = new Map<StateKey, Promise<unknown>>();
  const failed = new Set<StateKey>();
  const listeners = new Set<() => void>();
  let inFlight = 0;

  const statusOf = (): SaveStatus => (failed.size > 0 ? 'error' : timers.size > 0 || inFlight > 0 ? 'saving' : 'saved');
  const notify = () => listeners.forEach((listener) => listener());

  const send = (key: StateKey, options?: { keepalive?: boolean }) => {
    clearTimeout(timers.get(key));
    timers.delete(key);
    inFlight++;
    notify();
    const sent = (queues.get(key) ?? Promise.resolve())
      .then(() => client.save(key, snapshot[key], options))
      .then(
        () => failed.delete(key),
        () => failed.add(key),
      )
      .finally(() => {
        inFlight--;
        notify();
      });
    queues.set(key, sent);
    return sent;
  };

  const repository = <K extends StateKey>(key: K, fallback: () => NonNullable<RemoteState[K]>) => ({
    load: (): NonNullable<RemoteState[K]> => snapshot[key] ?? fallback(),
    save: (value: NonNullable<RemoteState[K]>) => {
      if (value === snapshot[key]) return;
      snapshot[key] = value;
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => send(key), delayMs));
      notify();
    },
  });

  const repositories: Repositories = {
    applications: repository('applications', () => []),
    drafts: repository('drafts', () => []),
    stages: repository('stages', () => DEFAULT_STAGES),
    profile: repository('profile', () => defaultProfile),
  };

  const status: SaveStatusSource = {
    get: statusOf,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return {
    repositories,
    status,
    retry: () => Promise.all([...failed].map((key) => send(key))),
    flush: (options?: { keepalive?: boolean }) => Promise.all([...timers.keys()].map((key) => send(key, options))),
  };
};
