"use client";

// devert.in's half of the activity heartbeat (lib/activity.js). Campus has
// always pinged user_activity_daily once a minute while its tab is visible;
// the main site never did, so "how many were active today" and "average time
// spent" had no data for devert.in at all. Same rules as Campus: signed-in
// users only, one ping on arrival and one per PING_INTERVAL_MIN while the tab
// is VISIBLE (a backgrounded tab is not engaged time), tagged with site
// "main" and the first path segment as the section. /admin is excluded so the
// operator's own time never shows up in the engagement numbers.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { pingActivity, PING_INTERVAL_MIN } from "@/lib/activity";

export function ActivityHeartbeat() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => { pathRef.current = pathname; }, [pathname]);

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    const send = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const path = pathRef.current || "/";
      if (path.startsWith("/admin")) return;
      const section = path.split("/")[1] || "home";
      pingActivity(uid, { site: "main", section }).catch(() => {});
    };
    send();
    const id = setInterval(send, PING_INTERVAL_MIN * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.uid]);

  return null;
}
