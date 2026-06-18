import { useState } from "react";
import { useStore } from "../store";
import type { AIProvider } from "../types";
import { aiReady, providerLabel } from "../lib/ai/run";
import { redirectUri, startGeminiOAuth } from "../lib/ai/oauth";
import { Panel, SectionTitle, Field, Toggle, CopyButton } from "../ui";

const PROVIDERS: AIProvider[] = ["claude", "openai", "gemini"];

/**
 * Optional AI connection settings. Disabled by default. Keys are stored on this
 * device only (and excluded from JSON backups). This trades the "no key" purity
 * for one-click generation — the copy/paste workflow still works without it.
 */
export default function ConnectionsPanel() {
  const { state, setAI } = useStore();
  const ai = state.ai;
  const [oauthErr, setOauthErr] = useState<string | null>(null);

  const ready = aiReady(ai);
  const tokenValid = ai.geminiAuthMode === "oauth" && ai.geminiAccessToken && (ai.geminiTokenExpiry ?? 0) > Date.now();

  return (
    <Panel>
      <SectionTitle
        icon="🔌"
        title="Connections (AI)"
        subtitle="Optional — run prompts in-app instead of copy/paste. Keys stay on this device."
        right={
          <span className={`badge ${ready ? "border-teal-400/40 bg-teal-400/15 text-teal-200" : "border-white/10 bg-white/5 text-slate-400"}`}>
            {ai.enabled ? (ready ? `● ${providerLabel(ai.provider)} ready` : "○ needs a key") : "○ off"}
          </span>
        }
      />

      <Toggle
        checked={ai.enabled}
        onChange={(v) => setAI({ enabled: v })}
        label="Enable in-app AI generation"
        description="Adds a “Run with AI” button to generators. Off by default."
      />

      {ai.enabled && (
        <div className="mt-4 space-y-4">
          <Field label="Provider">
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAI({ provider: p })}
                  className={`btn btn-sm ${ai.provider === p ? "btn-primary" : "btn-ghost"}`}
                >
                  {providerLabel(p)}
                </button>
              ))}
            </div>
          </Field>

          {ai.provider === "claude" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Anthropic API key" hint="From console.anthropic.com. Stored locally only.">
                <input className="input" type="password" value={ai.claudeKey} onChange={(e) => setAI({ claudeKey: e.target.value })} placeholder="sk-ant-…" />
              </Field>
              <Field label="Model">
                <input className="input" value={ai.claudeModel} onChange={(e) => setAI({ claudeModel: e.target.value })} placeholder="claude-opus-4-8" />
              </Field>
            </div>
          )}

          {ai.provider === "openai" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="OpenAI API key" hint="From platform.openai.com. Stored locally only.">
                <input className="input" type="password" value={ai.openaiKey} onChange={(e) => setAI({ openaiKey: e.target.value })} placeholder="sk-…" />
              </Field>
              <Field label="Model">
                <input className="input" value={ai.openaiModel} onChange={(e) => setAI({ openaiModel: e.target.value })} placeholder="gpt-4o" />
              </Field>
            </div>
          )}

          {ai.provider === "gemini" && (
            <div className="space-y-4">
              <Field label="Authentication">
                <div className="flex gap-2">
                  <button className={`btn btn-sm ${ai.geminiAuthMode === "key" ? "btn-primary" : "btn-ghost"}`} onClick={() => setAI({ geminiAuthMode: "key" })}>API key</button>
                  <button className={`btn btn-sm ${ai.geminiAuthMode === "oauth" ? "btn-primary" : "btn-ghost"}`} onClick={() => setAI({ geminiAuthMode: "oauth" })}>Google OAuth (experimental)</button>
                </div>
              </Field>

              {ai.geminiAuthMode === "key" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Google AI API key" hint="From aistudio.google.com. Stored locally only.">
                    <input className="input" type="password" value={ai.geminiKey} onChange={(e) => setAI({ geminiKey: e.target.value })} placeholder="AIza…" />
                  </Field>
                  <Field label="Model">
                    <input className="input" value={ai.geminiModel} onChange={(e) => setAI({ geminiModel: e.target.value })} placeholder="gemini-1.5-flash" />
                  </Field>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-100/90">
                    Experimental. In Google Cloud, create an OAuth <b>Client ID</b> (type: Web application) and add this exact
                    <b> Authorized redirect URI</b>:
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-amber-100">{redirectUri()}</code>
                      <CopyButton text={redirectUri()} label="Copy" className="btn btn-ghost btn-sm" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="OAuth Client ID">
                      <input className="input" value={ai.geminiClientId} onChange={(e) => setAI({ geminiClientId: e.target.value })} placeholder="…apps.googleusercontent.com" />
                    </Field>
                    <Field label="Model">
                      <input className="input" value={ai.geminiModel} onChange={(e) => setAI({ geminiModel: e.target.value })} placeholder="gemini-1.5-flash" />
                    </Field>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!ai.geminiClientId.trim()}
                      onClick={async () => {
                        setOauthErr(null);
                        try {
                          await startGeminiOAuth(ai.geminiClientId.trim());
                        } catch (e) {
                          setOauthErr(e instanceof Error ? e.message : "Could not start sign-in.");
                        }
                      }}
                    >
                      {tokenValid ? "↻ Re-authorize Google" : "Sign in with Google"}
                    </button>
                    {tokenValid && <span className="text-xs text-emerald-300">✓ Signed in</span>}
                    {ai.geminiAccessToken && !tokenValid && <span className="text-xs text-amber-300">Token expired — re-authorize</span>}
                  </div>
                  {oauthErr && <p className="text-sm text-rose-300">⚠️ {oauthErr}</p>}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            🔒 Keys are stored in this browser only and sent directly to the provider — never to any Mnemo Med server (there
            isn't one). They're excluded from JSON backups. On a shared device, clear them when done.
          </div>
        </div>
      )}
    </Panel>
  );
}
