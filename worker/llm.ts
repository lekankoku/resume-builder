export interface LlmUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
}

export interface LlmJsonRequest {
  instructions: string;
  input: string;
  schemaName: string;
  schema: object;
}

export interface LlmJsonResult {
  output: unknown;
  provider: string;
  model: string;
  usage: LlmUsage;
}

export interface LlmProvider {
  generateJson(request: LlmJsonRequest): Promise<LlmJsonResult>;
}

export interface LlmEnv {
  LLM_PROVIDER?: string;
  LLM_MODEL?: string;
  LLM_REASONING_EFFORT?: string;
  OPENAI_API_KEY?: string;
}

export class LlmNotConfiguredError extends Error {}

interface OpenAiConfig {
  apiKey: string;
  model: string;
  reasoningEffort: string;
}

interface OpenAiResponse {
  status: string;
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string } | null;
  output: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
  usage: { input_tokens: number; output_tokens: number; input_tokens_details?: { cached_tokens?: number } };
}

export const providerFrom = (env: LlmEnv, fetchFn: typeof fetch): LlmProvider => {
  switch (env.LLM_PROVIDER) {
    case 'openai':
      if (!env.OPENAI_API_KEY || !env.LLM_MODEL) throw new LlmNotConfiguredError('OpenAI is not configured');
      return createOpenAiProvider({ apiKey: env.OPENAI_API_KEY, model: env.LLM_MODEL, reasoningEffort: env.LLM_REASONING_EFFORT ?? 'medium' }, fetchFn);
    default:
      throw new LlmNotConfiguredError(`Unknown LLM provider ${env.LLM_PROVIDER}`);
  }
};

export const createOpenAiProvider = (config: OpenAiConfig, fetchFn: typeof fetch): LlmProvider => ({
  async generateJson({ instructions, input, schemaName, schema }) {
    const response = await fetchFn('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        instructions,
        input: [{ role: 'user', content: [{ type: 'input_text', text: input }] }],
        reasoning: { effort: config.reasoningEffort },
        text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
      }),
    });
    const body = (await response.json()) as OpenAiResponse;
    if (!response.ok) throw new Error(body.error?.message ?? `OpenAI request failed with ${response.status}`);
    if (body.status !== 'completed') throw new Error(`OpenAI response incomplete: ${body.incomplete_details?.reason ?? body.status}`);

    const content = body.output.find((item) => item.type === 'message')?.content ?? [];
    const refusal = content.find((part) => part.type === 'refusal');
    if (refusal) throw new Error(`OpenAI refused: ${refusal.refusal}`);
    const text = content.find((part) => part.type === 'output_text')?.text;
    if (!text) throw new Error('OpenAI returned no output');

    return {
      output: JSON.parse(text),
      provider: 'openai',
      model: config.model,
      usage: {
        inputTokens: body.usage.input_tokens,
        cachedInputTokens: body.usage.input_tokens_details?.cached_tokens ?? 0,
        outputTokens: body.usage.output_tokens,
      },
    };
  },
});
