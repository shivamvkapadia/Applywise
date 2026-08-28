// Thin server-side wrapper around the OpenRouter Chat Completions API.
// The API key is read from the local Settings row and never reaches the browser.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenRouterError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/** Run one chat completion and return the assistant's text. */
export async function chat(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  if (!opts.apiKey) {
    throw new OpenRouterError("No OpenRouter API key set. Add one in Settings.");
  }

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
        // Optional attribution headers recommended by OpenRouter.
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Applywise",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 1500,
      }),
      signal: opts.signal,
    });
  } catch (err) {
    throw new OpenRouterError(
      `Could not reach OpenRouter. Check your internet connection. (${
        (err as Error).message
      })`
    );
  }

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      detail = body?.error?.message ?? detail;
    } catch {
      /* ignore parse errors */
    }
    if (res.status === 401) {
      throw new OpenRouterError(
        "OpenRouter rejected your API key (401). Double-check it in Settings.",
        401
      );
    }
    throw new OpenRouterError(`OpenRouter error: ${detail}`, res.status);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new OpenRouterError("OpenRouter returned an empty response.");
  }
  return text.trim();
}
