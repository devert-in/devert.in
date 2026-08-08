"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Surfaces that keep native clipboard/right-click even for locked-down readers.
//
// - Form fields: the lockdown stops text moving in or out, not typing, so the
//   caret has to survive. Blocking the clipboard here still leaves login,
//   search and every answer box fully typeable.
// - [data-allow-clipboard]: per-element hatch, applies to any role.
//
// .monaco-editor was on this list and is deliberately NOT any more. The original
// reasoning was that a code editor whose clipboard does not work is broken and
// the code in it belongs to the user - true for a hobby playground, false here.
// Every Monaco surface on this site is a graded one (CodeLab problems, contest
// coding questions, campus practice), so a working paste in the editor is a
// working paste of somebody else's solution. Typing is untouched; only clipboard
// transfer and select-all are blocked.
const EXEMPT_SURFACES = [
  "input",
  "textarea",
  "select",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[data-allow-clipboard]",
].join(", ");

// Selection has to stay alive inside these or the caret goes with it. Monaco
// stays here even though it is no longer clipboard-exempt: killing user-select
// inside it takes the caret and breaks typing outright, and selection alone is
// harmless once the clipboard events themselves are blocked.
const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true'], .monaco-editor";

const CLIPBOARD_KEYS = new Set(["c", "x", "v", "a"]);

// Lifts the CSS half of the lockdown; see globals.css.
const UNLOCKED_CLASS = "clipboard-unlocked";

function element(event) {
  const { target } = event;
  if (target instanceof Element) return target;
  // Text nodes fire events too; climb to the nearest element.
  if (target && target.parentElement instanceof Element) return target.parentElement;
  return null;
}

function isExempt(event) {
  const el = element(event);
  return el !== null && el.closest(EXEMPT_SURFACES) !== null;
}

function isEditable(event) {
  const el = element(event);
  return el !== null && el.closest(EDITABLE) !== null;
}

/**
 * Blocks right-click, text selection, drag-out and clipboard operations site
 * wide. Mounted once from the root layout, inside AuthProvider so it can see
 * whether this account holds the admin claim.
 *
 * Admins are exempt. The exemption keys off the `admin` custom auth claim that
 * AuthContext reads off the ID token, not off a Firestore field, so a reader
 * cannot unlock themselves by editing client state.
 *
 * Fails closed: the claim resolves asynchronously (a token fetch), so the
 * lockdown is active from first paint and only lifts once adminChecked confirms
 * an admin. A slow or failed token fetch leaves the site locked, never open.
 *
 * Note that the ~20 share/copy buttons across the app call
 * navigator.clipboard.writeText(), which is programmatic and unaffected by
 * blocking the `copy` event, so they keep working for everyone.
 */
export function ContentGuard() {
  const { isAdmin, adminChecked } = useAuth() ?? {};
  const unlocked = adminChecked === true && isAdmin === true;

  useEffect(() => {
    document.documentElement.classList.toggle(UNLOCKED_CLASS, unlocked);
    return () => document.documentElement.classList.remove(UNLOCKED_CLASS);
  }, [unlocked]);

  useEffect(() => {
    // Admins get no listeners at all, so there is nothing to bypass.
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

    // Capture phase so nothing downstream can act on the event first.
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
