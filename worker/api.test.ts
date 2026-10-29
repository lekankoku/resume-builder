import { beforeEach, describe, expect, it } from 'vitest';
import { Env, handleApi } from './api';
import { MAX_DOCUMENT_BYTES } from './documents';
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

class FakeR2 {
  readonly objects = new Map<string, { body: ArrayBuffer; contentType?: string; customMetadata: Record<string, string> }>();

  async put(key: string, body: ArrayBuffer, options: R2PutOptions) {
    this.objects.set(key, { body, contentType: (options.httpMetadata as R2HTTPMetadata).contentType, customMetadata: options.customMetadata ?? {} });
  }

  async get(key: string) {
    const object = this.objects.get(key);
    return object && { body: new Blob([object.body]).stream(), arrayBuffer: async () => object.body, customMetadata: object.customMetadata };
  }

  async list({ cursor }: R2ListOptions) {
    const keys = [...this.objects.keys()];
    const index = cursor ? Number(cursor) : 0;
    const key = keys[index];
    const objects = key ? [{ key, size: this.objects.get(key)!.body.byteLength, uploaded: new Date(), customMetadata: this.objects.get(key)!.customMetadata }] : [];
    const truncated = index + 1 < keys.length;
    return { objects, truncated, cursor: truncated ? String(index + 1) : undefined };
  }

  async delete(key: string) {
    this.objects.delete(key);
  }
}

const request = (path: string, init: RequestInit = {}) => new Request(`https://resume.example.com${path}`, init);

describe('handleApi', () => {
  let db: FakeD1;
  let bucket: FakeR2;
  let env: Env;

  beforeEach(() => {
    db = new FakeD1();
    bucket = new FakeR2();
    env = { DB: db as unknown as D1Database, DOCUMENTS: bucket as unknown as R2Bucket, ACCESS_DISABLED: 'true' };
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

  describe('documents', () => {
    const upload = (name: string, body: BodyInit = crypto.randomUUID()) =>
      handleApi(request('/api/documents', { method: 'POST', headers: { 'X-File-Name': encodeURIComponent(name) }, body }), env);

    const list = async () => (await handleApi(request('/api/documents'), env)).json() as Promise<{ id: string; name: string; size: number }[]>;

    it('stores an uploaded file and lists it with its name and size', async () => {
      const name = `${crypto.randomUUID()} CV.pdf`;
      const body = crypto.randomUUID();

      const response = await upload(name, body);
      const created = (await response.json()) as { id: string };

      expect(response.status).toBe(201);
      expect(await list()).toEqual([expect.objectContaining({ id: created.id, name, size: body.length })]);
      expect(bucket.objects.get(created.id)?.contentType).toBe('application/pdf');
    });

    it('lists documents across every page of the bucket', async () => {
      await upload(`${crypto.randomUUID()}.pdf`);
      await upload(`${crypto.randomUUID()}.png`);
      await upload(`${crypto.randomUUID()}.txt`);

      expect(await list()).toHaveLength(3);
    });

    it('rejects a file type that is not allowed', async () => {
      const response = await upload(`${crypto.randomUUID()}.html`, '<script>alert(1)</script>');

      expect(response.status).toBe(415);
      expect(bucket.objects.size).toBe(0);
    });

    it('rejects an empty file', async () => {
      expect((await upload(`${crypto.randomUUID()}.pdf`, '')).status).toBe(400);
    });

    it('rejects a file larger than 20 MB', async () => {
      const response = await upload(`${crypto.randomUUID()}.pdf`, new Uint8Array(MAX_DOCUMENT_BYTES + 1));

      expect(response.status).toBe(413);
      expect(bucket.objects.size).toBe(0);
    });

    it('serves a PDF inline with its original name', async () => {
      const name = `${crypto.randomUUID()} résumé.pdf`;
      const body = crypto.randomUUID();
      const { id } = (await (await upload(name, body)).json()) as { id: string };

      const response = await handleApi(request(`/api/documents/${id}`), env);

      expect(await response.text()).toBe(body);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe(`inline; filename*=UTF-8''${encodeURIComponent(name)}`);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('serves a text file inline so it can be previewed', async () => {
      const { id } = (await (await upload(`${crypto.randomUUID()}.txt`)).json()) as { id: string };

      const response = await handleApi(request(`/api/documents/${id}`), env);

      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toMatch(/^inline;/);
    });

    it('serves a Word document as a download', async () => {
      const { id } = (await (await upload(`${crypto.randomUUID()}.docx`)).json()) as { id: string };

      const response = await handleApi(request(`/api/documents/${id}`), env);

      expect(response.headers.get('Content-Disposition')).toMatch(/^attachment;/);
    });

    it('deletes a document', async () => {
      const { id } = (await (await upload(`${crypto.randomUUID()}.pdf`)).json()) as { id: string };

      const response = await handleApi(request(`/api/documents/${id}`, { method: 'DELETE' }), env);

      expect(response.status).toBe(204);
      expect(await list()).toEqual([]);
    });

    describe('rename', () => {
      const rename = (id: string, body: unknown) =>
        handleApi(request(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }), env);

      it('renames a document, keeping its content and upload date', async () => {
        // Given
        const content = crypto.randomUUID();
        const { id, uploadedAt } = (await (await upload(`${crypto.randomUUID()}.pdf`, content)).json()) as { id: string; uploadedAt: string };
        const name = `${crypto.randomUUID()} renamed.pdf`;

        // When
        const response = await rename(id, { name: `  ${name}  ` });

        // Then
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id, name, size: content.length, uploadedAt });
        expect(await list()).toEqual([expect.objectContaining({ id, name })]);
        expect(await (await handleApi(request(`/api/documents/${id}`), env)).text()).toBe(content);
      });

      it('serves the document with the content type of its new extension', async () => {
        // Given
        const { id } = (await (await upload(`${crypto.randomUUID()}.txt`)).json()) as { id: string };

        // When
        await rename(id, { name: `${crypto.randomUUID()}.pdf` });

        // Then
        expect(bucket.objects.get(id)?.contentType).toBe('application/pdf');
      });

      it.each([
        ['an extension that is not allowed', { name: `${crypto.randomUUID()}.html` }],
        ['a blank name', { name: '   ' }],
        ['a name that is not a string', { name: 1 }],
      ])('rejects %s and keeps the original name', async (_, body) => {
        // Given
        const original = `${crypto.randomUUID()}.pdf`;
        const { id } = (await (await upload(original)).json()) as { id: string };

        // When
        const response = await rename(id, body);

        // Then
        expect(response.status).toBe(415);
        expect(await list()).toEqual([expect.objectContaining({ id, name: original })]);
      });

      it('returns 404 for a document that does not exist', async () => {
        expect((await rename(crypto.randomUUID(), { name: `${crypto.randomUUID()}.pdf` })).status).toBe(404);
      });
    });

    it.each([
      ['a document that does not exist', `/api/documents/${crypto.randomUUID()}`],
      ['an id that is not a UUID', '/api/documents/..%2Fstate'],
    ])('returns 404 for %s', async (_, path) => {
      expect((await handleApi(request(path), env)).status).toBe(404);
    });
  });

  describe('access', () => {
    const teamDomain = `${crypto.randomUUID()}.cloudflareaccess.com`;
    const aud = crypto.randomUUID();

    beforeEach(() => {
      env = { DB: db as unknown as D1Database, DOCUMENTS: bucket as unknown as R2Bucket, ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: aud };
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
      const response = await handleApi(request('/api/state/stages', { method: 'PUT', body: '[]' }), { DB: env.DB, DOCUMENTS: env.DOCUMENTS });

      expect(response.status).toBe(401);
      expect(db.rows.size).toBe(0);
    });
  });
});
