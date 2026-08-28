// Tiny single-password gate, used by middleware (edge) and the unlock route.
// The lock is active only when the APP_PASSWORD env var is set — when it's
// unset (e.g. local dev), the site is open.

export const AUTH_COOKIE = "app_auth";

// Deterministic token derived from the password. The cookie stores this hash
// (not the password). Uses Web Crypto so it runs in both edge middleware and
// Node route handlers.
export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`applywise-auth:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
