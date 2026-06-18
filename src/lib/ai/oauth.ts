/**
 * Gemini OAuth via Google's Authorization Code + PKCE flow — for a static,
 * backend-less app (no client secret). The user registers their own Google
 * OAuth client and adds this app's URL as an authorized redirect URI.
 *
 * Experimental: Google's Generative Language API is primarily API-key based;
 * OAuth support depends on the user's client/scope configuration. The API-key
 * path is the recommended default.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/generative-language.retriever";
const STORAGE_KEY = "mnemo-med:oauth-pkce";

function randomString(bytes = 48): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return base64url(arr.buffer);
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(text: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

/** This app's redirect URI = its own URL with no query/hash. */
export function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export async function startGeminiOAuth(clientId: string): Promise<void> {
  const verifier = randomString();
  const challenge = base64url(await sha256(verifier));
  const state = randomString(16);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ verifier, state, clientId }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "consent",
    state,
  });
  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

export interface OAuthResult {
  accessToken: string;
  expiresAt: number;
}

/**
 * If the current URL is an OAuth redirect, exchange the code for a token.
 * Always strips the query string from the URL afterward. Returns null when
 * there's no pending OAuth redirect.
 */
export async function completeGeminiOAuthIfPresent(): Promise<OAuthResult | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!code && !err) return null;

  // Clean the URL no matter what so a refresh doesn't re-trigger.
  window.history.replaceState({}, document.title, redirectUri());

  if (err) throw new Error(`Google sign-in failed: ${err}`);
  if (!raw) return null;
  const { verifier, state: savedState, clientId } = JSON.parse(raw);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!code || state !== savedState) throw new Error("OAuth state mismatch — please try again.");

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}). Check the Client ID and redirect URI.`);
  const json = await res.json();
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}
