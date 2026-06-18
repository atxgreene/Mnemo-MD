import type { AISettings } from "../../types";

/**
 * Optional AI adapter. Lets a user run a generated prompt directly against
 * their chosen provider instead of copy/pasting.
 *
 * - Claude: official @anthropic-ai/sdk in browser mode (dynamically imported so
 *   it only loads when used). Default model claude-opus-4-8.
 * - OpenAI / Gemini: direct streaming fetch (no extra SDK dependency).
 *
 * Keys are read from local settings and never sent anywhere but the provider.
 */

export type TokenHandler = (delta: string) => void;

/** A base64-encoded image (no data: prefix) for vision-capable models. */
export interface ImageInput {
  mediaType: string; // e.g. "image/png"
  base64: string;
}

export const DEFAULT_MODELS: Record<AISettings["provider"], string> = {
  claude: "claude-opus-4-8",
  openai: "gpt-4o",
  gemini: "gemini-1.5-flash",
};

export function aiReady(ai: AISettings): boolean {
  if (!ai.enabled) return false;
  if (ai.provider === "claude") return !!ai.claudeKey.trim();
  if (ai.provider === "openai") return !!ai.openaiKey.trim();
  // gemini
  return ai.geminiAuthMode === "oauth" ? !!ai.geminiAccessToken : !!ai.geminiKey.trim();
}

export function providerLabel(p: AISettings["provider"]): string {
  return p === "claude" ? "Claude" : p === "openai" ? "ChatGPT (OpenAI)" : "Gemini";
}

/** Run the prompt against the configured provider, streaming tokens via onToken. */
export async function runPrompt(
  prompt: string,
  ai: AISettings,
  onToken: TokenHandler,
  image?: ImageInput
): Promise<string> {
  switch (ai.provider) {
    case "claude":
      return runClaude(prompt, ai, onToken, image);
    case "openai":
      return runOpenAI(prompt, ai, onToken, image);
    case "gemini":
      return runGemini(prompt, ai, onToken, image);
  }
}

async function runClaude(prompt: string, ai: AISettings, onToken: TokenHandler, image?: ImageInput): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: ai.claudeKey.trim(), dangerouslyAllowBrowser: true });
  const content: unknown = image
    ? [
        { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } },
        { type: "text", text: prompt },
      ]
    : prompt;
  const stream = client.messages.stream({
    model: ai.claudeModel.trim() || DEFAULT_MODELS.claude,
    max_tokens: 16000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: [{ role: "user", content: content as any }],
  });
  stream.on("text", (t) => onToken(t));
  const final = await stream.finalMessage();
  return final.content
    .filter((b): b is { type: "text"; text: string } & typeof b => b.type === "text")
    .map((b) => ("text" in b ? b.text : ""))
    .join("");
}

async function runOpenAI(prompt: string, ai: AISettings, onToken: TokenHandler, image?: ImageInput): Promise<string> {
  const content: unknown = image
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${image.mediaType};base64,${image.base64}` } },
      ]
    : prompt;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.openaiKey.trim()}` },
    body: JSON.stringify({
      model: ai.openaiModel.trim() || DEFAULT_MODELS.openai,
      stream: true,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await safeText(res)}`);
  return readSSE(res, onToken, (json) => json?.choices?.[0]?.delta?.content ?? "");
}

async function runGemini(prompt: string, ai: AISettings, onToken: TokenHandler, image?: ImageInput): Promise<string> {
  const model = ai.geminiModel.trim() || DEFAULT_MODELS.gemini;
  const oauth = ai.geminiAuthMode === "oauth";
  let url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (oauth) {
    headers.Authorization = `Bearer ${ai.geminiAccessToken}`;
  } else {
    url += `&key=${encodeURIComponent(ai.geminiKey.trim())}`;
  }
  const parts = image
    ? [{ inline_data: { mime_type: image.mediaType, data: image.base64 } }, { text: prompt }]
    : [{ text: prompt }];
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ contents: [{ role: "user", parts }] }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await safeText(res)}`);
  return readSSE(res, onToken, (json) =>
    (json?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("")
  );
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return res.statusText;
  }
}

/** Parse a text/event-stream response, emitting extracted deltas. Returns the full text. */
async function readSSE(
  res: Response,
  onToken: TokenHandler,
  extract: (json: any) => string
): Promise<string> {
  if (!res.body) throw new Error("No response body to stream.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const delta = extract(JSON.parse(data));
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        /* ignore keep-alive / partial frames */
      }
    }
  }
  return full;
}
