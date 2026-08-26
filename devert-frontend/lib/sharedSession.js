// Cross-subdomain session bridge for devert.in / campus.devert.in - see
// AuthSessionController.java for the backend half. Deliberately uses a
// SAME-ORIGIN relative path ("/api/auth/..."), not NEXT_PUBLIC_API_URL's
// direct *.run.app URL like lib/staffAccounts.js's callBackend - a
// Set-Cookie(Domain=.devert.in) is only valid from a devert.in-family
// response, which is exactly what each Hosting site's own "/api/auth/**"
// rewrite (see firebase.json) provides and a direct *.run.app call would not.
// Every call here fails silently - this is a best-effort convenience, never
// something that should block or break sign-in/out if it errors.

export async function mintSharedSession(idToken) {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch { /* best-effort - the local session on this origin is unaffected either way */ }
}

export async function exchangeSharedSession() {
  try {
    const res = await fetch("/api/auth/session/exchange", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.customToken || null;
  } catch {
    return null;
  }
}

export async function clearSharedSession() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch { /* best-effort - local signOut() still proceeds regardless */ }
}
