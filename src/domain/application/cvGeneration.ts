export interface GenerationUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface UsageEntry extends GenerationUsage {
  id: string;
  createdAt: string;
  provider: string;
  model: string;
  company: string;
  role: string;
}

export interface UsageReport {
  entries: UsageEntry[];
  monthUsd: number;
  totalUsd: number;
}

export const formatUsd = (usd: number): string => (usd > 0 && usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`);
