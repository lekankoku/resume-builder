/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Env, handleApi } from './api';
import { costOf } from './generation';
import { ANALYSIS_INSTRUCTIONS, ANALYSIS_SCHEMA } from './prompts/analysis';
import { COVER_LETTER_INSTRUCTIONS, COVER_LETTER_SCHEMA } from './prompts/coverLetter';
import { CV_INSTRUCTIONS, CV_SCHEMA } from './prompts/cv';

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
  let job: { company: string; role: string; jobDescription: string };
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
    job = { company: crypto.randomUUID(), role: crypto.randomUUID(), jobDescription: crypto.randomUUID() };
    jobBank = crypto.randomUUID();
    await handleApi(request('/api/state/jobBank', { method: 'PUT', body: JSON.stringify(jobBank) }), env);
  });

  describe('POST /api/cv/analyse', () => {
    it('sends the job bank and job description with the analysis prompt and returns the analysis and cost', async () => {
      // Given
      const analysis = { tagline: crypto.randomUUID() };
      const fetchFn = vi.fn(async () => anOpenAiResponse(analysis));

      // When
      const response = await post('/api/cv/analyse', env, fetchFn, job);

      // Then
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        analysis,
        usage: { inputTokens: 8000, cachedInputTokens: 3000, outputTokens: 2000, costUsd: 0.153 },
      });
      const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
      const [sent] = sentBodies(fetchFn);
      expect(url).toBe('https://api.openai.com/v1/responses');
      expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${env.OPENAI_API_KEY}`);
      expect(sent.model).toBe(env.LLM_MODEL);
      expect(sent.instructions).toBe(ANALYSIS_INSTRUCTIONS);
      expect(sent.text.format).toEqual({ type: 'json_schema', name: 'cv_analysis', strict: true, schema: ANALYSIS_SCHEMA });
      expect(sent.input).toEqual([{ role: 'user', content: [{ type: 'input_text', text: expect.any(String) }] }]);
      const text = sent.input[0].content[0].text;
      expect(text).toContain(`<candidate_data>\n${jobBank}\n</candidate_data>`);
      expect(text).toContain(`<target_role>\n${job.role} at ${job.company}\n</target_role>`);
      expect(text).toContain(`<job_description>\n${job.jobDescription}\n</job_description>`);
    });

    it('records the call in the usage report', async () => {
      // Given
      await post('/api/cv/analyse', env, async () => anOpenAiResponse({}), job);

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
      expect(await purposes(env)).toEqual(['cv-analysis']);
    });

    it('rejects a missing job description without calling the LLM', async () => {
      // Given
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/analyse', env, fetchFn, { ...job, jobDescription: '  ' });

      // Then
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Add the job description first' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('rejects analysis when no job bank is saved', async () => {
      // Given
      await handleApi(request('/api/state/jobBank', { method: 'PUT', body: JSON.stringify('') }), env);
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/analyse', env, fetchFn, job);

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
      const response = await post('/api/cv/analyse', { ...env, ...override }, fetchFn, job);

      // Then
      expect(response.status).toBe(503);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('returns 502 with the OpenAI error and records nothing when the call fails', async () => {
      // Given
      const message = crypto.randomUUID();
      const fetchFn = async () => new Response(JSON.stringify({ error: { message } }), { status: 429 });

      // When
      const response = await post('/api/cv/analyse', env, fetchFn, job);

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
      const response = await post('/api/cv/analyse', env, fetchFn, job);

      // Then
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error });
    });
  });

  describe('POST /api/cv/write', () => {
    let analysis: object;
    let answers: { field: string; answer: string }[];
    let written: { cv: object; review: object };

    beforeEach(() => {
      analysis = { tagline: crypto.randomUUID() };
      answers = [{ field: crypto.randomUUID(), answer: crypto.randomUUID() }];
      written = { cv: { header: { title: crypto.randomUUID() } }, review: { gaps: [crypto.randomUUID()] } };
    });

    it('writes the CV from the analysis and answers without a cover letter when none is requested', async () => {
      // Given
      const fetchFn = vi.fn(async () => anOpenAiResponse(written));

      // When
      const response = await post('/api/cv/write', env, fetchFn, { ...job, analysis, answers, coverLetter: false });

      // Then
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        ...written,
        coverLetter: null,
        usage: { inputTokens: 8000, cachedInputTokens: 3000, outputTokens: 2000, costUsd: 0.153 },
      });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      const [sent] = sentBodies(fetchFn);
      expect(sent.instructions).toBe(CV_INSTRUCTIONS);
      expect(sent.text.format).toEqual({ type: 'json_schema', name: 'tailored_cv', strict: true, schema: CV_SCHEMA });
      const text = sent.input[0].content[0].text;
      expect(text).toContain(`<analysis>\n${JSON.stringify(analysis)}\n</analysis>`);
      expect(text).toContain(`<answers>\n${JSON.stringify(answers)}\n</answers>`);
      expect(text).toContain(`<candidate_data>\n${jobBank}\n</candidate_data>`);
      expect(text).toContain(`<job_description>\n${job.jobDescription}\n</job_description>`);
      expect(await purposes(env)).toEqual(['cv']);
    });

    it('writes the cover letter from the written CV and motivation when one is requested', async () => {
      // Given
      const coverLetter = { letter: { subject: crypto.randomUUID() }, review: { questions: [] } };
      const motivation = crypto.randomUUID();
      const fetchFn = vi.fn().mockResolvedValueOnce(anOpenAiResponse(written)).mockResolvedValueOnce(anOpenAiResponse(coverLetter));

      // When
      const response = await post('/api/cv/write', env, fetchFn, { ...job, analysis, answers, coverLetter: true, motivation });

      // Then
      expect(await response.json()).toEqual({
        ...written,
        coverLetter,
        usage: { inputTokens: 16000, cachedInputTokens: 6000, outputTokens: 4000, costUsd: expect.closeTo(0.306) },
      });
      const [, sent] = sentBodies(fetchFn);
      expect(sent.instructions).toBe(COVER_LETTER_INSTRUCTIONS);
      expect(sent.text.format).toEqual({ type: 'json_schema', name: 'cover_letter', strict: true, schema: COVER_LETTER_SCHEMA });
      const text = sent.input[0].content[0].text;
      expect(text).toContain(`<cv>\n${JSON.stringify(written.cv)}\n</cv>`);
      expect(text).toContain(`<motivation>\n${motivation}\n</motivation>`);
      expect(text).toContain(`<answers>\n${JSON.stringify(answers)}\n</answers>`);
      expect(await purposes(env)).toEqual(['cv', 'cover-letter']);
    });

    it('rejects writing before the job is analysed', async () => {
      // Given
      const fetchFn = vi.fn();

      // When
      const response = await post('/api/cv/write', env, fetchFn, { ...job, answers });

      // Then
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Analyse the job first' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('returns 502 when the cover letter fails after the CV was written', async () => {
      // Given
      const message = crypto.randomUUID();
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(anOpenAiResponse(written))
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message } }), { status: 500 }));

      // When
      const response = await post('/api/cv/write', env, fetchFn, { ...job, analysis, answers, coverLetter: true });

      // Then
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: message });
      expect(await purposes(env)).toEqual(['cv']);
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
      await post('/api/cv/analyse', env, async () => anOpenAiResponse({}), job);

      // When
      const report = (await (await handleApi(request('/api/usage'), env)).json()) as { entries: { createdAt: string }[]; monthUsd: number; totalUsd: number };

      // Then
      expect(report.monthUsd).toBe(0.153);
      expect(report.totalUsd).toBe(2.653);
      expect(report.entries.map((e) => e.createdAt)[1]).toBe(lastYear);
    });

    it.each([
      ['/api/usage', 'POST'],
      ['/api/cv/analyse', 'GET'],
      ['/api/cv/write', 'GET'],
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
