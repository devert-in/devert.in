"use client";

// One hook for "what can this account do".
//
// Kept separate from lib/entitlements.js so that file stays pure and importable
// from anywhere (including a script or a server context) without dragging React
// and a Firestore listener along with it.

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { watchSubscription } from "@/lib/payments";
import { TIER, canUse, isPro, resolveTier } from "@/lib/entitlements";

export function useTier() {
  const { user, userData, isAdmin, adminChecked } = useAuth() ?? {};

  // Keyed by uid rather than held as a bare {sub, checked} pair, for two reasons
  // that both bit the first version of this hook:
  //
  // 1. No setState in the effect body. This project's React lint rules treat
  //    that as an error (see lib/useKeyedFetch.js's header for the same
  //    constraint), so there is nowhere to "reset to unchecked" on a uid change.
  // 2. Keying solves that for free. A newly signed-in uid simply has no entry
  //    yet, so `checked` reads false for THEM without anything being cleared -
  //    and the previous user's subscription can never be shown to the next one,
  //    which a shared pair would do for a frame on a quick logout/login.
  const [byUid, setByUid] = useState({});

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    return watchSubscription(uid, (sub) => {
      setByUid((prev) => ({ ...prev, [uid]: { checked: true, sub } }));
    });
  }, [user]);

  const entry = user ? byUid[user.uid] : null;
  const subscription = entry?.sub ?? null;
  // A signed-out visitor has nothing to look up, so they are "checked" already -
  // otherwise the free experience would sit behind a spinner forever.
  const subChecked = user ? !!entry?.checked : true;

  const tier = resolveTier({ userData, subscription, isAdmin: isAdmin === true });

  return {
    tier,
    subscription,
    isPro: isPro(tier),
    isCampus: tier === TIER.CAMPUS,
    // Gate a PAYWALL on this, never the free experience: showing free content
    // early is harmless, but rendering "upgrade to continue" to somebody who
    // already paid - even for one frame - is the worst possible greeting.
    ready: !!adminChecked && subChecked,
    can: (feature) => canUse(feature, tier),
  };
}
