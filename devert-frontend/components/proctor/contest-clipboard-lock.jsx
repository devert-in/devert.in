"use client";

import { useEffect } from "react";

// Total clipboard lockdown for the duration of a proctored contest attempt.
//
// WHY components/content-guard.jsx IS NOT ENOUGH. That guard is the site-wide
// lockdown, and it deliberately EXEMPTS `.monaco-editor` - its own comment
// explains why: "a code editor whose copy/paste you cannot use is broken, and
// the code in it belongs to the user, not to DeVert". That is the right call for
// CodeLab, practice and every other surface.
//
// Inside a proctored contest it is precisely the hole. The one field a candidate
// most wants to paste a solution into is the code editor, so the surface the
// site-wide guard leaves open is the only one that matters here. This component
// closes it, and only while an invigilated attempt is actually running.
//
// CAPTURE PHASE, on `document`. Monaco does not use a plain <textarea> you can
// attach onPaste to - it drives a hidden textarea and handles clipboard events in
// its own listeners. Registering on the bubble phase means Monaco has already
// inserted the text by the time we see the event; capture runs first, so
// preventDefault() actually stops the insertion. stopImmediatePropagation() then
// keeps the event from reaching Monaco's handler at all.
//
// WHAT IS DELIBERATELY LEFT ALONE:
//  - Typing. Only clipboard and drag transfer are blocked, never keystrokes, so
//    the candidate can still write code normally.
//  - Ctrl/Cmd+A. Select-all moves nothing on its own, and copy/cut are already
//    dead, so blocking it only breaks legitimate editing.
//  - Everything outside a proctored attempt. This mounts and unmounts with the
//    attempt; nothing here is global.
//
// WHAT THIS DOES NOT CLAIM TO STOP: a second device, a phone camera, or a
// screen-reading tool. Clipboard blocking raises the effort of the laziest
// cheat; the camera and the violation log are what actually deter the rest.
// Treating this as the whole defence would be a mistake.

const BLOCKED_EVENTS = ["copy", "cut", "paste", "dragstart", "drop", "contextmenu"];

export function ContestClipboardLock({ onBlocked }) {
  useEffect(() => {
    const stop = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      // Reported so a paste attempt can be recorded against the attempt rather
      // than silently swallowed - an invigilator wants to know somebody tried.
      onBlocked?.(e.type);
      return false;
    };

    // Keyboard route, in case a browser or extension synthesises the edit
    // without firing a clipboard event we can see.
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "c" || k === "v" || k === "x") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onBlocked?.(`key:${k}`);
      }
    };

    for (const type of BLOCKED_EVENTS) {
      document.addEventListener(type, stop, { capture: true });
    }
    document.addEventListener("keydown", onKeyDown, { capture: true });

    // Middle-click paste on X11 arrives as a `paste` event in Chromium, already
    // covered above, but the auxclick that triggers it is worth killing too so
    // the caret does not jump mid-attempt.
    const onAux = (e) => { if (e.button === 1) { e.preventDefault(); e.stopImmediatePropagation(); } };
    document.addEventListener("auxclick", onAux, { capture: true });

    return () => {
      for (const type of BLOCKED_EVENTS) {
        document.removeEventListener(type, stop, { capture: true });
      }
      document.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("auxclick", onAux, { capture: true });
    };
  }, [onBlocked]);

  return null;
}
