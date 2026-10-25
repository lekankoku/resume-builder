import { ANALYSIS_INSTRUCTIONS, ANALYSIS_SCHEMA, analysisInput, Job } from './prompts/analysis';
import { COVER_LETTER_INSTRUCTIONS, COVER_LETTER_SCHEMA, coverLetterInput } from './prompts/coverLetter';
import { Answer, CV_INSTRUCTIONS, CV_SCHEMA, cvInput } from './prompts/cv';
import { LlmEnv, LlmJsonRequest, LlmJsonResult, LlmNotConfiguredError, LlmUsage, providerFrom } from './llm';

export interface GenerationEnv extends LlmEnv {
  DB: D1Database;
  LLM_PRICE_INPUT_PER_M?: string;
  LLM_PRICE_CACHED_INPUT_PER_M?: string;
  LLM_PRICE_OUTPUT_PER_M?: string;
}

interface Prices {
  input: number;
  cachedInput: number;
  output: number;
}

interface UsageRow {
  id: string;
  created_at: string;
  provider: string;
  model: string;
  purpose: string;
  company: string;
  role: string;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

interface JobRequest {
  company?: string;
  role?: string;
  jobDescription?: string;
}

interface WriteRequest extends JobRequest {
  analysis?: unknown;
  answers?: Answer[];
  coverLetter?: boolean;
  motivation?: string;
}

type Stage = (purpose: string, request: LlmJsonRequest) => Promise<unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const handleGeneration = async (request: Request, env: GenerationEnv, pathname: string, fetchFn: typeof fetch): Promise<Response> => {
  if (pathname === '/api/cv/analyse' && request.method === 'POST') return analyse(request, env, fetchFn);
  if (pathname === '/api/cv/write' && request.method === 'POST') return write(request, env, fetchFn);
  if (pathname === '/api/usage' && request.method === 'GET') return usageReport(env.DB);
  return json({ error: 'Not found' }, 404);
};

const analyse = async (request: Request, env: GenerationEnv, fetchFn: typeof fetch): Promise<Response> => {
  const body = (await request.json()) as JobRequest;
  const jobBank = (await loadState<string>(env.DB, 'jobBank')) ?? '';
  const missing = missingInput(body, jobBank);
  if (missing) return json({ error: missing }, 400);

  const job = jobOf(body);
  return generating(env, fetchFn, job, async (stage) => ({
    analysis: await stage('cv-analysis', {
      instructions: ANALYSIS_INSTRUCTIONS,
      input: analysisInput(jobBank, job),
      schemaName: 'cv_analysis',
      schema: ANALYSIS_SCHEMA,
    }),
  }));
};

const write = async (request: Request, env: GenerationEnv, fetchFn: typeof fetch): Promise<Response> => {
  const body = (await request.json()) as WriteRequest;
  const jobBank = (await loadState<string>(env.DB, 'jobBank')) ?? '';
  const missing = missingInput(body, jobBank) ?? (body.analysis ? null : 'Analyse the job first');
  if (missing) return json({ error: missing }, 400);

  const job = jobOf(body);
  const answers = body.answers ?? [];
  return generating(env, fetchFn, job, async (stage) => {
    const { cv, review } = (await stage('cv', {
      instructions: CV_INSTRUCTIONS,
      input: cvInput(jobBank, job, body.analysis, answers),
      schemaName: 'tailored_cv',
      schema: CV_SCHEMA,
    })) as { cv: unknown; review: unknown };
    const coverLetter = body.coverLetter
      ? await stage('cover-letter', {
          instructions: COVER_LETTER_INSTRUCTIONS,
          input: coverLetterInput(jobBank, job, body.analysis, cv, answers, body.motivation ?? ''),
          schemaName: 'cover_letter',
          schema: COVER_LETTER_SCHEMA,
        })
      : null;
    return { cv, review, coverLetter };
  });
};

const missingInput = (body: JobRequest, jobBank: string): string | null => {
  if (!body.jobDescription?.trim()) return 'Add the job description first';
  if (!jobBank.trim()) return 'Add your job bank in Settings first';
  return null;
};

const jobOf = (body: JobRequest): Job => ({ company: body.company ?? '', role: body.role ?? '', jobDescription: body.jobDescription ?? '' });

const generating = async (
  env: GenerationEnv,
  fetchFn: typeof fetch,
  job: Job,
  work: (stage: Stage) => Promise<object>,
): Promise<Response> => {
  const usage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, costUsd: 0 };
  try {
    const provider = providerFrom(env, fetchFn);
    const result = await work(async (purpose, request) => {
      const { output, ...call } = await provider.generateJson(request);
      const costUsd = costOf(call.usage, pricesOf(env));
      await recordUsage(env.DB, call, purpose, job, costUsd);
      usage.inputTokens += call.usage.inputTokens;
      usage.cachedInputTokens += call.usage.cachedInputTokens;
      usage.outputTokens += call.usage.outputTokens;
      usage.costUsd += costUsd;
      return output;
    });
    return json({ ...result, usage });
  } catch (e) {
    return json({ error: (e as Error).message }, e instanceof LlmNotConfiguredError ? 503 : 502);
  }
};

const recordUsage = (db: D1Database, call: Omit<LlmJsonResult, 'output'>, purpose: string, job: Job, costUsd: number) =>
  db
    .prepare(
      'INSERT INTO llm_usage (id, created_at, provider, model, purpose, company, role, input_tokens, cached_input_tokens, output_tokens, cost_usd) ' +
        'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)',
    )
    .bind(
      crypto.randomUUID(),
      new Date().toISOString(),
      call.provider,
      call.model,
      purpose,
      job.company,
      job.role,
      call.usage.inputTokens,
      call.usage.cachedInputTokens,
      call.usage.outputTokens,
      costUsd,
    )
    .run();

const loadState = async <T>(db: D1Database, key: string): Promise<T | null> => {
  const row = await db.prepare('SELECT value FROM store WHERE key = ?1').bind(key).first<{ value: string }>();
  return row ? (JSON.parse(row.value) as T) : null;
};

const pricesOf = (env: GenerationEnv): Prices => ({
  input: Number(env.LLM_PRICE_INPUT_PER_M ?? 0),
  cachedInput: Number(env.LLM_PRICE_CACHED_INPUT_PER_M ?? 0),
  output: Number(env.LLM_PRICE_OUTPUT_PER_M ?? 0),
});

export const costOf = (usage: LlmUsage, prices: Prices): number =>
  ((usage.inputTokens - usage.cachedInputTokens) * prices.input + usage.cachedInputTokens * prices.cachedInput + usage.outputTokens * prices.output) /
  1_000_000;

const usageReport = async (db: D1Database): Promise<Response> => {
  const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;
  const { results } = await db.prepare('SELECT * FROM llm_usage ORDER BY created_at DESC LIMIT 50').all<UsageRow>();
  const totals = await db
    .prepare('SELECT COALESCE(SUM(cost_usd), 0) AS total, COALESCE(SUM(CASE WHEN created_at >= ?1 THEN cost_usd END), 0) AS month FROM llm_usage')
    .bind(monthStart)
    .first<{ total: number; month: number }>();
  return json({
    entries: results.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      provider: row.provider,
      model: row.model,
      company: row.company,
      role: row.role,
      inputTokens: row.input_tokens,
      cachedInputTokens: row.cached_input_tokens,
      outputTokens: row.output_tokens,
      costUsd: row.cost_usd,
    })),
    monthUsd: totals?.month ?? 0,
    totalUsd: totals?.total ?? 0,
  });
};
