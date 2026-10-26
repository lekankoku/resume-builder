/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Env, handleApi } from './api';
import { costOf } from './generation';
import { SUGGESTIONS_INSTRUCTIONS, SUGGESTIONS_SCHEMA } from './prompts/suggestions';

const sqliteD1 = (): D1Database => {
  const db = new DatabaseSync(':memory:');
  for (const file of readdirSync('migrations').sort()) db.exec(readFileSync(`migrations/${file}`, 'utf8'));
  const prepare = (sql: string) => {
    let params: (string | number)[] = [];
    const statement = {
      bind: (...args: (string | number)[]) => {
        params = args;
        return statement;
      },
      first: async () => db.prepare(sql).get(...params) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...params) }),
      run: async () => {
        db.prepare(sql).run(...params);
        return { success: true };
      },
    };
    return statement;
  };
  return { prepare } as unknown as D1Database;
};

const anOpenAiResponse = (output: unknown, usage = { input_tokens: 8000, output_tokens: 2000, input_tokens_details: { cached_tokens: 3000 } }) =>
  new Response(JSON.stringify({ status: 'completed', output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(output) }] }], usage }), {
    status: 200,
  });

const request = (path: string, init: RequestInit = {}) => new Request(`https://resume.example.com${path}`, init);

const post = (path: string, env: Env, fetchFn: typeof fetch, body: object) =>
  handleApi(request(path, { method: 'POST', body: JSON.stringify(body) }), env, undefined, fetchFn);

const sentBodies = (fetchFn: ReturnType<typeof vi.fn>) =>
  fetchFn.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

const purposes = async (env: Env) =>
  (await env.DB.prepare('SELECT purpose FROM llm_usage ORDER BY rowid').all<{ purpose: string }>()).results.map((row) => row.purpose);

describe('CV generation', () => {
  let env: Env;
  let job: { company: string; role: string; jobDescription: string; resume: object; coverLetter: object };
  let jobBank: string;

  beforeEach(async () => {
    env = {
      DB: sqliteD1(),
      DOCUMENTS: {} as R2Bucket,
      ACCESS_DISABLED: 'true',
      LLM_PROVIDER: 'openai',
      LLM_MODEL: crypto.randomUUID(),
      OPENAI_API_KEY: crypto.randomUUID(),
      LLM_PRICE_INPUT_PER_M: '10',
      LLM_PRICE_CACHED_INPUT_PER_M: '1',
      LLM_PRICE_OUTPUT_PER_M: '50',
    };
    job = {
      company: crypto.randomUUID(),
      role: crypto.randomUUID(),
      jobDescription: crypto.randomUUID(),
      resume: { personal: { title: crypto.randomUUID() } },
      coverLetter: { body: crypto.randomUUID() },
    };
    jobBank = crypto.randomUUID();
    await handleApi(request('/api/state/jobBank', { method: 'PUT', body: JSON.stringify(jobBank) }), env);
  });

  describe('POST /api/cv/suggest', () => {
    it('sends the CV, cover letter, candidate data and job description with the suggestions prompt and returns the suggestions and cost', async () => {
      // Given
      const suggestions = { summary: crypto.randomUUID(), gaps: [], questions: [], suggestions: [] };
      const fetchFn = vi.fn(async () => anOpenAiResponse(suggestions));

      // When
      const response = await post('/api/cv/suggest', env, fetchFn, job);

      // Then
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        ...suggestions,
        usage: { inputTokens: 8000, cachedInputTokens: 3000, outputTokens: 2000, costUsd: 0.153 },
      });
      const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
      const [sent] = sentBodies(fetchFn);
      expect(url).toBe('https://api.openai.com/v1/responses');
      expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${env.OPENAI_API_KEY}`);
      expect(sent.model).toBe(env.LLM_MODEL);
      expect(sent.instructions).toBe(SUGGESTIONS_INSTRUCTIONS);
      expect(sent.text.format).toEqual({ type: 'json_schema', name: 'cv_suggestions', strict: true, schema: SUGGESTIONS_SCHEMA });
      expect(sent.input).toEqual([{ role: 'user', content: [{ type: 'input_text', text: expect.any(String) }] }]);
      const text = sent.input[0].content[0].text;
      expect(text).toContain(`<cv>\n${JSON.stringify(job.resume)}\n</cv>`);
      expect(text).toContain(`<cover_letter>\n${JSON.stringify(job.coverLetter)}\n</cover_letter>`);
      expect(text).toContain(`<job_bank>\n${jobBank}\n</job_bank>\n</candidate_data>`);
      expect(text).toContain(`<target_role>\n${job.role} at ${job.company}\n</target_role>`);
      expect(text).toContain(`<job_description>\n${job.jobDescription}\n</job_description>`);
      expect(await purposes(env)).toEqual(['suggestions']);
    });

    it('rejects a request without a CV to review', async () => {
      // Given
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/suggest', env, fetchFn, { ...job, resume: undefined });

      // Then
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Send the CV to review' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('sends the profile without contact details and the saved facts as candidate data', async () => {
      // Given
      const profile = {
        name: crypto.randomUUID(),
        residence: crypto.randomUUID(),
        nationality: crypto.randomUUID(),
        website: crypto.randomUUID(),
        linkedin: crypto.randomUUID(),
        github: crypto.randomUUID(),
        phone: crypto.randomUUID(),
        email: crypto.randomUUID(),
        photoUrl: crypto.randomUUID(),
      };
      const facts = {
        workAuthorization: 'has-permit',
        permit: crypto.randomUUID(),
        languages: [{ name: crypto.randomUUID(), level: 'C1', basis: 'certificate' }],
        references: [{ name: crypto.randomUUID(), consented: true, isCurrentManager: false }],
        education: [{ institution: crypto.randomUUID(), completed: true }],
        answers: [{ question: crypto.randomUUID(), answer: crypto.randomUUID() }],
      };
      await handleApi(request('/api/state/profile', { method: 'PUT', body: JSON.stringify(profile) }), env);
      await handleApi(request('/api/state/facts', { method: 'PUT', body: JSON.stringify(facts) }), env);
      const fetchFn = vi.fn(async () => anOpenAiResponse({}));

      // When
      await post('/api/cv/suggest', env, fetchFn, job);

      // Then
      const text: string = sentBodies(fetchFn)[0].input[0].content[0].text;
      const { name, residence, nationality, website, linkedin, github } = profile;
      expect(text).toContain(`<profile>\n${JSON.stringify({ name, residence, nationality, website, linkedin, github })}\n</profile>`);
      expect(text).not.toContain(profile.phone);
      expect(text).not.toContain(profile.email);
      expect(text).not.toContain(profile.photoUrl);
      expect(text).toContain(`<work_authorization>\n${JSON.stringify({ status: 'has-permit', permit: facts.permit })}\n</work_authorization>`);
      expect(text).toContain(`<languages>\n${JSON.stringify(facts.languages)}\n</languages>`);
      expect(text).toContain(`<references>\n${JSON.stringify(facts.references)}\n</references>`);
      expect(text).toContain(`<education>\n${JSON.stringify(facts.education)}\n</education>`);
      expect(text).toContain(`<remembered_answers>\n${JSON.stringify(facts.answers)}\n</remembered_answers>`);
    });

    it('marks work authorisation as unknown and sends empty facts when none are saved', async () => {
      // Given
      const fetchFn = vi.fn(async () => anOpenAiResponse({}));

      // When
      await post('/api/cv/suggest', env, fetchFn, job);

      // Then
      const text: string = sentBodies(fetchFn)[0].input[0].content[0].text;
      expect(text).toContain(`<work_authorization>\n${JSON.stringify({ status: 'unknown', permit: '' })}\n</work_authorization>`);
      expect(text).toContain('<languages>\n[]\n</languages>');
      expect(text).toContain('<remembered_answers>\n[]\n</remembered_answers>');
    });

    it('records the call in the usage report', async () => {
      // Given
      await post('/api/cv/suggest', env, async () => anOpenAiResponse({}), job);

      // When
      const report = await (await handleApi(request('/api/usage'), env)).json();

      // Then
      expect(report).toEqual({
        entries: [
          expect.objectContaining({
            provider: 'openai',
            model: env.LLM_MODEL,
            company: job.company,
            role: job.role,
            inputTokens: 8000,
            cachedInputTokens: 3000,
            outputTokens: 2000,
            costUsd: 0.153,
          }),
        ],
        monthUsd: 0.153,
        totalUsd: 0.153,
      });
      expect(await purposes(env)).toEqual(['suggestions']);
    });

    it('rejects a missing job description without calling the LLM', async () => {
      // Given
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/suggest', env, fetchFn, { ...job, jobDescription: '  ' });

      // Then
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Add the job description first' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('rejects suggestions when no job bank is saved', async () => {
      // Given
      await handleApi(request('/api/state/jobBank', { method: 'PUT', body: JSON.stringify('') }), env);
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/suggest', env, fetchFn, job);

      // Then
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Add your job bank in Settings first' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it.each([
      ['no API key', { OPENAI_API_KEY: undefined }],
      ['an unknown provider', { LLM_PROVIDER: crypto.randomUUID() }],
    ])('returns 503 when the LLM has %s', async (_, override) => {
      // Given
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/suggest', { ...env, ...override }, fetchFn, job);

      // Then
      expect(response.status).toBe(503);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('returns 502 with the OpenAI error and records nothing when the call fails', async () => {
      // Given
      const message = crypto.randomUUID();
      const fetchFn = async () => new Response(JSON.stringify({ error: { message } }), { status: 429 });

      // When
      const response = await post('/api/cv/suggest', env, fetchFn, job);

      // Then
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: message });
      expect(await (await handleApi(request('/api/usage'), env)).json()).toEqual({ entries: [], monthUsd: 0, totalUsd: 0 });
    });

    it.each([
      ['an incomplete response', { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] }, 'OpenAI response incomplete: max_output_tokens'],
      ['a refusal', { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] }, 'OpenAI refused: no'],
      ['no output text', { status: 'completed', output: [] }, 'OpenAI returned no output'],
    ])('returns 502 for %s', async (_, body, error) => {
      // Given
      const fetchFn = async () => new Response(JSON.stringify(body), { status: 200 });

      // When
      const response = await post('/api/cv/suggest', env, fetchFn, job);

      // Then
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error });
    });
  });

  describe('GET /api/usage', () => {
    it('totals only this month in monthUsd and everything in totalUsd', async () => {
      // Given
      const lastYear = `${new Date().getFullYear() - 1}-06-01T00:00:00.000Z`;
      await env.DB.prepare(
        "INSERT INTO llm_usage VALUES (?1, ?2, 'openai', 'old-model', 'cv', '', '', 1, 0, 1, 2.5)",
      )
        .bind(crypto.randomUUID(), lastYear)
        .run();
      await post('/api/cv/suggest', env, async () => anOpenAiResponse({}), job);

      // When
      const report = (await (await handleApi(request('/api/usage'), env)).json()) as { entries: { createdAt: string }[]; monthUsd: number; totalUsd: number };

      // Then
      expect(report.monthUsd).toBe(0.153);
      expect(report.totalUsd).toBe(2.653);
      expect(report.entries.map((e) => e.createdAt)[1]).toBe(lastYear);
    });

    it.each([
      ['/api/usage', 'POST'],
      ['/api/cv/suggest', 'GET'],
    ])('returns 404 for %s with %s', async (path, method) => {
      expect((await handleApi(request(path, { method }), env)).status).toBe(404);
    });
  });

  describe('costOf', () => {
    it('charges cached input at the cached rate and the rest at the full rate', () => {
      expect(costOf({ inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 100_000 }, { input: 10, cachedInput: 1, output: 50 })).toBeCloseTo(11.4);
    });
  });
});
