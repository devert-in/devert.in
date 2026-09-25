"use client";

// Captures ?ref=CODE and attributes it once the visitor actually has an account.
//
// The two-step - stash now, attribute later - is the whole point. Someone landing
// on an ambassador's link is almost never signed in yet, and by the time they
// finish Google sign-in the query string is long gone (the OAuth round trip
// replaces the URL). Attributing only at click time would credit nobody; stashing
// in localStorage and attributing on first authenticated render credits the
// ambassador who actually earned it.
//
// Attribution is write-once by rule (see firestore.rules' referrals/{referredUid}),
// so re-running this is harmless: an existing attribution is returned untouched
// rather than overwritten, and a second ambassador cannot steal the signup.

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { attributeReferral, normalizeReferralCode, REFERRAL_NEW_ACCOUNT_WINDOW_MS } from "@/lib/ambassadors";

const STASH_KEY = "devert.referralCode";

export function ReferralCapture() {
  const { user } = useAuth();

  // Stash on arrival, whether or not anyone is signed in.
  useEffect(() => {
    const code = normalizeReferralCode(new URLSearchParams(window.location.search).get("ref"));
    if (!code) return;
    try {
      // First code wins. A visitor who later clicks a different ambassador's link
      // should not silently re-credit - whoever actually introduced them keeps it.
      if (!window.localStorage.getItem(STASH_KEY)) {
        window.localStorage.setItem(STASH_KEY, code);
      }
    } catch {
      // Private mode / storage disabled - attribution is a nice-to-have, never a
      // reason to break the page someone is trying to read.
    }
  }, []);

  // Attribute once there is an account to attribute to.
  useEffect(() => {
    if (!user) return;
    let code = null;
    try { code = window.localStorage.getItem(STASH_KEY); } catch { /* see above */ }
    if (!code) return;

    // Only a brand-new account is a signup. An existing user who clicked an
    // ambassador's link was not brought in by them - drop the stash for good.
    const created = Date.parse(user.metadata?.creationTime || "");
    if (!created || Date.now() - created > REFERRAL_NEW_ACCOUNT_WINDOW_MS) {
      try { window.localStorage.removeItem(STASH_KEY); } catch { /* noop */ }
      return;
    }

    attributeReferral(user.uid, code)
      .then((res) => {
        // Cleared on a definitive outcome only. A null result can mean the code
        // belongs to a not-yet-approved ambassador, and that application may be
        // approved tomorrow - so the code is kept for a later attempt rather than
        // thrown away on the first miss.
        if (res) { try { window.localStorage.removeItem(STASH_KEY); } catch { /* noop */ } }
      })
      .catch(() => { /* never surfaced - the visitor did not ask for this */ });
  }, [user]);

  return null;
}
