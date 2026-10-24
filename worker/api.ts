import { fetchAccessJwks, FetchJwks, verifyAccessJwt } from './access';

export interface Env {
  DB: D1Database;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ACCESS_DISABLED?: string;
}

const STATE_KEYS = ['applications', 'drafts', 'stages', 'profile'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const handleApi = async (request: Request, env: Env, fetchJwks: FetchJwks = fetchAccessJwks): Promise<Response> => {
  if (!(await isAuthorized(request, env, fetchJwks))) return json({ error: 'Unauthorized' }, 401);

  const { pathname } = new URL(request.url);
  if (pathname === '/api/state' && request.method === 'GET') return loadState(env.DB);

  const key = pathname.match(/^\/api\/state\/([^/]+)$/)?.[1];
  if (key && request.method === 'PUT') {
    if (!STATE_KEYS.includes(key)) return json({ error: 'Unknown key' }, 404);
    return saveState(env.DB, key, await request.text());
  }

  return json({ error: 'Not found' }, 404);
};

const isAuthorized = async (request: Request, env: Env, fetchJwks: FetchJwks): Promise<boolean> => {
  if (env.ACCESS_DISABLED === 'true') return true;
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  return !!token && verifyAccessJwt(token, { teamDomain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD }, fetchJwks);
};

const loadState = async (db: D1Database): Promise<Response> => {
  const { results } = await db.prepare('SELECT key, value FROM store').all<{ key: string; value: string }>();
  return json(Object.fromEntries(results.map((row) => [row.key, JSON.parse(row.value)])));
};

const saveState = async (db: D1Database, key: string, body: string): Promise<Response> => {
  try {
    JSON.parse(body);
  } catch {
    return json({ error: 'Body must be JSON' }, 400);
  }
  await db
    .prepare(
      'INSERT INTO store (key, value, updated_at) VALUES (?1, ?2, ?3) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    )
    .bind(key, body, new Date().toISOString())
    .run();
  return new Response(null, { status: 204 });
};
