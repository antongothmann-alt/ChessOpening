import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce';

// Lichess supports "public clients" for exactly this use case: a browser app
// with no backend and no client secret. Any client_id identifying the app is
// fine, and the redirect_uri just needs to match between the authorize step
// and the token exchange step — Lichess doesn't require pre-registration.
const CLIENT_ID = 'opening-trainer-pwa';
const AUTHORIZE_URL = 'https://lichess.org/oauth';
const TOKEN_URL = 'https://lichess.org/api/token';

const VERIFIER_KEY = 'chess-trainer:oauth-verifier';
const STATE_KEY = 'chess-trainer:oauth-state';
const TOKEN_KEY = 'chess-trainer:lichess-token:v1';

interface StoredToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export function getToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (parsed.expiresAt <= Date.now()) return null;
    return parsed.accessToken;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function startLogin(): Promise<void> {
  const verifier = generateCodeVerifier();
  const state = generateState();
  const challenge = await generateCodeChallenge(verifier);

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });

  window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Call once on app load. If the URL contains an OAuth redirect (?code=...),
 * completes the token exchange, stores the token, and cleans the URL.
 * Safe to call when there's no OAuth redirect present — it's a no-op then.
 */
export async function handleAuthRedirect(): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (!code && !error) return;

  // Clean the URL regardless of outcome so refreshing doesn't replay it
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  window.history.replaceState({}, '', url.toString());

  if (error || !code) return;

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!verifier || !state || state !== expectedState) return;

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(),
        client_id: CLIENT_ID,
        code_verifier: verifier,
      }).toString(),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    const stored: StoredToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
  } catch {
    // Network error during token exchange — user stays logged out, can retry
  }
}
