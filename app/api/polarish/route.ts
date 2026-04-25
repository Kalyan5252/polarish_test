import { create } from "@polarish/ai";
import {
  ANTHROPIC_CLAUDE_CODE_MODELS,
  AnthropicClaudeCodeModelId,
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  OPENAI_CODEX_MODELS,
  OpenAiCodexModelId,
  ProviderId,
  resolveProviderAndModel,
} from "@/lib/polarish";

const client = create({
  baseUrl: "http://127.0.0.1:4318",
});

type RequestBody = {
  prompt?: string;
  provider?: string;
  model?: string;
};

const SYSTEM_PROMPT =
  "You are a senior ad agency strategist. Write concise, high-impact campaign copy with strong clarity and CTA.";

async function generateCopy(provider: ProviderId, model: string, prompt: string) {
  if (provider === "openai-codex") {
    const resolvedModel = OPENAI_CODEX_MODELS.find((item) => item === model) ?? OPENAI_CODEX_MODELS[0];

    return client.generate({
      provider,
      model: resolvedModel as OpenAiCodexModelId,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      temperature: 0.7,
      maxRetries: 1,
    });
  }

  const resolvedModel =
    ANTHROPIC_CLAUDE_CODE_MODELS.find((item) => item === model) ?? ANTHROPIC_CLAUDE_CODE_MODELS[0];

  return client.generate({
    provider,
    model: resolvedModel as AnthropicClaudeCodeModelId,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    stream: false,
    temperature: 0.7,
    maxRetries: 1,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const selectedProvider = body.provider ?? DEFAULT_PROVIDER;
    const selectedModel = body.model ?? DEFAULT_MODEL;
    const { provider, model } = resolveProviderAndModel(selectedProvider, selectedModel);

    try {
      const result = await generateCopy(provider, model, prompt);

      if (result.stream) {
        return Response.json(
          { error: "Unexpected stream response for non-stream request." },
          { status: 500 },
        );
      }

      return Response.json({
        text: result.response.text,
        provider,
        model,
      });
    } catch {
      // Subscription/entitlement can fail for selected model.
      // Retry with a likely accessible model for the same provider.
      const fallback = resolveProviderAndModel(provider, "");

      const result = await generateCopy(fallback.provider, fallback.model, prompt);

      if (result.stream) {
        return Response.json(
          { error: "Unexpected stream response for fallback non-stream request." },
          { status: 500 },
        );
      }

      return Response.json({
        text: result.response.text,
        provider: fallback.provider,
        model: fallback.model,
        fallbackUsed: true,
      });
    }
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}
