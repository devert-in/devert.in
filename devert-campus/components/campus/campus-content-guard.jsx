"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Blocks right-click, text selection, drag-out and clipboard operations
// across all of campus.devert.in, for every non-admin visitor.
//
// Ported from devert-frontend/components/content-guard.jsx, which used to
// cover this exact surface via a `pathname.startsWith("/campus")` check back
// when Campus rendered inside the main app at /campus/{slug}. That check can
// never match now that Campus is its own app with no "/campus" prefix on any
// of its own routes (see campus-app.jsx's own header on that), so mounting
// the original component here unmodified would stay a permanent no-op - the
// SAME bug the dead `pathname.startsWith("/campus")` guards elsewhere in
// devert-frontend have, just silent instead of merely cosmetic: this one is
// the entire clipboard/right-click lockdown for every Campus page,
// including live invigilated contest attempts (use-proctor-session.js adds
// .proctor-active to <html> and relies on THIS component's CSS pairing in
// globals.css to withdraw the Monaco/form-field exemptions during one - see
// campus-contests.jsx's use of that hook). There is no "rest of the site" to
// exempt from within this app, so unlike the original there is no pathname
// check at all - just the admin exemption.
//
// See devert-frontend/components/content-guard.jsx for the full reasoning
// behind the exemption list (form fields, Monaco, [data-allow-clipboard])
// and the admin-claim-based, fail-closed exemption; kept in sync with it
// deliberately rather than imported, since the two now differ only in the
// removed pathname gate.

const EXEMPT_SURFACES = [
  "input",
  "textarea",
  "select",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[data-allow-clipboard]",
].join(", ");

const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true'], .monaco-editor";

const CLIPBOARD_KEYS = new Set(["c", "x", "v", "a"]);

const UNLOCKED_CLASS = "clipboard-unlocked";

function element(event) {
  const { target } = event;
  if (target instanceof Element) return target;
  if (target && target.parentElement instanceof Element) return target.parentElement;
  return null;
}

function isExempt(event) {
  const el = element(event);
  if (el === null) return false;
  if (el.closest("[data-allow-clipboard]") !== null) return true;
  if (el.closest(".monaco-editor") !== null) return false;
  return el.closest(EXEMPT_SURFACES) !== null;
}

function isEditable(event) {
  const el = element(event);
  return el !== null && el.closest(EDITABLE) !== null;
}

export function CampusContentGuard() {
  const { isAdmin, adminChecked } = useAuth() ?? {};
  // Fails closed: the admin claim resolves asynchronously (a token fetch),
  // so the lockdown is active from first paint and only lifts once
  // adminChecked confirms an admin.
  const unlocked = adminChecked === true && isAdmin === true;

  useEffect(() => {
    document.documentElement.classList.toggle(UNLOCKED_CLASS, unlocked);
    return () => document.documentElement.classList.remove(UNLOCKED_CLASS);
  }, [unlocked]);

  useEffect(() => {
    if (unlocked) return;

    const block = (event) => {
      if (isExempt(event)) return;
      event.preventDefault();
    };

    const blockSelection = (event) => {
      if (isEditable(event) || isExempt(event)) return;
      event.preventDefault();
    };

    const blockShortcuts = (event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.altKey) return;
      if (!CLIPBOARD_KEYS.has(event.key.toLowerCase())) return;
      if (isExempt(event)) return;
      event.preventDefault();
    };

    const options = { capture: true };
    const listeners = [
      ["contextmenu", block],
      ["copy", block],
      ["cut", block],
      ["paste", block],
      ["dragstart", block],
      ["drop", block],
      ["selectstart", blockSelection],
      ["keydown", blockShortcuts],
    ];

    for (const [type, handler] of listeners) {
      document.addEventListener(type, handler, options);
    }

    return () => {
      for (const [type, handler] of listeners) {
        document.removeEventListener(type, handler, options);
      }
    };
  }, [unlocked]);

  return null;
}
