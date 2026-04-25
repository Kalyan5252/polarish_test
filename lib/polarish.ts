export const PROVIDERS = [
  {
    id: "openai-codex",
    label: "OpenAI Codex",
    models: ["gpt-5.2", "gpt-5.3-codex", "gpt-5.3-codex-spark", "gpt-5.4", "gpt-5.4-mini", "gpt-5.5"],
  },
  {
    id: "anthropic-claude-code",
    label: "Anthropic Claude Code",
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];
export type ModelId = (typeof PROVIDERS)[number]["models"][number];
export type OpenAiCodexModelId = (typeof PROVIDERS)[0]["models"][number];
export type AnthropicClaudeCodeModelId = (typeof PROVIDERS)[1]["models"][number];

export const DEFAULT_PROVIDER: ProviderId = "openai-codex";
export const DEFAULT_MODEL: ModelId = "gpt-5.4-mini";

const providerMap = new Map(PROVIDERS.map((provider) => [provider.id, provider]));
export const OPENAI_CODEX_MODELS = PROVIDERS[0].models;
export const ANTHROPIC_CLAUDE_CODE_MODELS = PROVIDERS[1].models;

export function isProviderId(value: string): value is ProviderId {
  return providerMap.has(value as ProviderId);
}

export function getModelsForProvider(provider: ProviderId): readonly ModelId[] {
  return providerMap.get(provider)?.models ?? [];
}

export function resolveProviderAndModel(inputProvider: string, inputModel: string) {
  const provider: ProviderId = isProviderId(inputProvider) ? inputProvider : DEFAULT_PROVIDER;
  const models = getModelsForProvider(provider);
  const model = models.find((item) => item === inputModel) ?? models[0] ?? DEFAULT_MODEL;
  return { provider, model };
}

export function resolveModelForProvider(provider: ProviderId, inputModel: string): ModelId {
  return getModelsForProvider(provider).find((item) => item === inputModel) ?? DEFAULT_MODEL;
}
