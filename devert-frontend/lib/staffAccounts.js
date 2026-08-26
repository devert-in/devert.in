import { auth } from "@/lib/firebase";

// Every write to institutions/{id}/roleAssignments/{uid} goes through
// devert-backend's AdminAccountController - firestore.rules makes that
// collection isAdmin()-only for any DIRECT client write (see
// firestore.rules' own comment there), specifically so a browser can never
// create another person's Firebase Auth account or generate a password
// anyone but the target account holder ever sees. These functions are thin
// fetch() wrappers, same shape as lib/codelab.js's runCode/submitCode -
// Bearer token from the CALLER's own session, backend re-derives and
// re-checks authorization itself rather than trusting anything here.
function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

async function callBackend(path, method, body) {
  const base = apiUrl();
  if (!base) throw new Error("Admin account management isn't configured yet (NEXT_PUBLIC_API_URL is unset).");
  if (!auth.currentUser) throw new Error("Sign in to continue.");
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

// roleKey: "principal" | "hod" | "facultyClassTeacher" (see
// lib/permissions.js's ROLE_CATALOG). department required only for "hod",
// classroomId required only for "facultyClassTeacher" - the backend
// re-validates both against the caller's own scope regardless of what's
// sent here. Returns { uid, emailSent }.
export async function createStaffAccount({ institutionId, roleKey, email, displayName, department, classroomId }) {
  return callBackend("/api/campus/accounts", "POST", {
    institutionId, roleKey, email, displayName, department, classroomId,
  });
}

export async function setStaffAccountStatus({ institutionId, uid, status }) {
  return callBackend(`/api/campus/accounts/${uid}/status`, "PATCH", { institutionId, uid, status });
}

export async function resetStaffAccountPassword({ institutionId, uid }) {
  return callBackend(`/api/campus/accounts/${uid}/reset-password`, "POST", { institutionId, uid });
}

export async function resendStaffAccountSetup({ institutionId, uid }) {
  return callBackend(`/api/campus/accounts/${uid}/resend-setup`, "POST", { institutionId, uid });
}

// permissionOverrides is the COMPLETE intended override map, not a delta -
// the backend replaces the account's existing overrides with exactly this.
export async function updateStaffAccountPermissions({ institutionId, uid, permissionOverrides }) {
  return callBackend(`/api/campus/accounts/${uid}/permissions`, "PATCH", { institutionId, uid, permissionOverrides });
}

// Called by CampusStaffLogin right after signInWithEmailAndPassword resolves
// - success requires the fresh session's own Bearer token (handled by
// callBackend above); failure has no valid session to attach one to, so it
// posts unauthenticated with just the attempted email (see
// devert-backend's LoginFailureRequest).
export async function recordStaffLoginSuccess({ institutionId }) {
  return callBackend("/api/campus/auth/login-success", "POST", { institutionId });
}

export async function recordStaffLoginFailure({ institutionId, email }) {
  const base = apiUrl();
  if (!base) return; // best-effort bookkeeping only - never blocks showing the user their real error
  try {
    await fetch(`${base}/api/campus/auth/login-failure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId, email }),
    });
  } catch { /* best-effort - a failed-attempt log entry is never worth surfacing an error for */ }
}
