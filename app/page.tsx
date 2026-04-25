"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  getModelsForProvider,
  isProviderId,
  PROVIDERS,
  ProviderId,
  resolveModelForProvider,
} from "@/lib/polarish";

type GenerateResponse = {
  text?: string;
  error?: string;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableModels = useMemo(() => getModelsForProvider(provider), [provider]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/polarish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          provider,
          model,
        }),
      });

      const data = (await response.json()) as GenerateResponse;
      setResult(data);
    } catch {
      setResult({ error: "Failed to generate content. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  function onProviderChange(nextProvider: string) {
    if (!isProviderId(nextProvider)) {
      return;
    }

    setProvider(nextProvider);
    setModel(getModelsForProvider(nextProvider)[0] ?? DEFAULT_MODEL);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold">Polarish Campaign Copy Generator</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Generate ad-ready copy using your own provider subscription through Polarish.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              Provider
              <select
                value={provider}
                onChange={(e) => onProviderChange(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {PROVIDERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Model
              <select
                value={model}
                onChange={(e) => setModel(resolveModelForProvider(provider, e.target.value))}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {availableModels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            Campaign prompt
            <textarea
              required
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Write launch copy for a premium social media management service for local restaurants."
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading || prompt.trim().length === 0}
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isLoading ? "Generating..." : "Generate copy"}
          </button>
        </form>

        {result && (
          <section className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
            {result.error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Provider: {result.provider}</span>
                  <span>Model: {result.model}</span>
                  {result.fallbackUsed && <span>Fallback model applied</span>}
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-6">{result.text}</pre>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
