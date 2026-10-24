import { RemoteState, StateClient, StateKey } from './ports/repositories';

export const migrateLocalState = async (remote: RemoteState, local: RemoteState, client: StateClient): Promise<RemoteState> => {
  if (Object.keys(remote).length > 0) return remote;
  await Promise.all((Object.keys(local) as StateKey[]).map((key) => client.save(key, local[key])));
  return local;
};
