import { beforeEach, describe, expect, it } from 'vitest';
import { Env, handleApi } from './api';
import { anAccessKeyPair } from './testing';

class FakeD1 {
  readonly rows = new Map<string, { value: string; updated_at: string }>();

  prepare(sql: string) {
    let params: unknown[] = [];
    const statement = {
      bind: (...args: unknown[]) => {
        params = args;
        return statement;
      },
      all: async () => ({ results: [...this.rows].map(([key, row]) => ({ key, value: row.value })) }),
      run: async () => {
        if (!sql.startsWith('INSERT INTO store')) throw new Error(`Unexpected SQL ${sql}`);
        const [key, value, updatedAt] = params as string[];
        this.rows.set(key, { value, updated_at: updatedAt });
        return { success: true };
      },
    };
    return statement;
  }
}

const request = (path: string, init: RequestInit = {}) => new Request(`https://resume.example.com${path}`, init);

describe('handleApi', () => {
  let db: FakeD1;
  let env: Env;

  beforeEach(() => {
    db = new FakeD1();
    env = { DB: db as unknown as D1Database, ACCESS_DISABLED: 'true' };
  });

  describe('state', () => {
    it('returns every stored key with its parsed value', async () => {
      const applications = [{ id: crypto.randomUUID() }];
      const stages = [crypto.randomUUID()];
      db.rows.set('applications', { value: JSON.stringify(applications), updated_at: '' });
      db.rows.set('stages', { value: JSON.stringify(stages), updated_at: '' });

      const response = await handleApi(request('/api/state'), env);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ applications, stages });
    });

    it('stores a known key and returns it on the next load', async () => {
      const profile = { name: crypto.randomUUID() };

      const saved = await handleApi(request('/api/state/profile', { method: 'PUT', body: JSON.stringify(profile) }), env);
      const loaded = await handleApi(request('/api/state'), env);

      expect(saved.status).toBe(204);
      expect(await loaded.json()).toEqual({ profile });
      expect(db.rows.get('profile')?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('overwrites the previous value of a key', async () => {
      const stages = [crypto.randomUUID()];
      await handleApi(request('/api/state/stages', { method: 'PUT', body: JSON.stringify([crypto.randomUUID()]) }), env);

      await handleApi(request('/api/state/stages', { method: 'PUT', body: JSON.stringify(stages) }), env);

      expect(JSON.parse(db.rows.get('stages')!.value)).toEqual(stages);
    });

    it('rejects an unknown key', async () => {
      const response = await handleApi(request(`/api/state/${crypto.randomUUID()}`, { method: 'PUT', body: '[]' }), env);

      expect(response.status).toBe(404);
      expect(db.rows.size).toBe(0);
    });

    it('rejects a body that is not JSON', async () => {
      const response = await handleApi(request('/api/state/stages', { method: 'PUT', body: '{ nope' }), env);

      expect(response.status).toBe(400);
      expect(db.rows.size).toBe(0);
    });

    it.each([
      ['an unknown path', '/api/other', 'GET'],
      ['an unsupported method', '/api/state', 'DELETE'],
    ])('returns 404 for %s', async (_, path, method) => {
      expect((await handleApi(request(path, { method }), env)).status).toBe(404);
    });
  });

  describe('access', () => {
    const teamDomain = `${crypto.randomUUID()}.cloudflareaccess.com`;
    const aud = crypto.randomUUID();

    beforeEach(() => {
      env = { DB: db as unknown as D1Database, ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: aud };
    });

    it('serves a request carrying a valid Access token', async () => {
      const { jwk, sign } = await anAccessKeyPair();
      const token = await sign({ aud: [aud], iss: `https://${teamDomain}`, exp: Math.floor(Date.now() / 1000) + 60 });

      const response = await handleApi(request('/api/state', { headers: { 'Cf-Access-Jwt-Assertion': token } }), env, async () => [jwk]);

      expect(response.status).toBe(200);
    });

    it('rejects a request without an Access token', async () => {
      const { jwk } = await anAccessKeyPair();

      expect((await handleApi(request('/api/state'), env, async () => [jwk])).status).toBe(401);
    });

    it('rejects a request with an invalid Access token', async () => {
      const { jwk } = await anAccessKeyPair();
      const headers = { 'Cf-Access-Jwt-Assertion': crypto.randomUUID() };

      expect((await handleApi(request('/api/state', { headers }), env, async () => [jwk])).status).toBe(401);
    });

    it('rejects every request when Access is not configured', async () => {
      const response = await handleApi(request('/api/state/stages', { method: 'PUT', body: '[]' }), { DB: env.DB });

      expect(response.status).toBe(401);
      expect(db.rows.size).toBe(0);
    });
  });
});
