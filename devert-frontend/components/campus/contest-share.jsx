"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Check, Copy, Link2, Mail, MessageCircle, QrCode, Send, Share2, X as XIcon,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";

// Share sheet for a Campus contest - copy link, QR, WhatsApp, Telegram, email,
// and the OS share sheet on mobile.
//
// THE URL. /campus/{slug}/contest/{id} is the app's own canonical deep link,
// not one invented here: campus-app.jsx parses `second === "contest" ? third`
// into initialContestId on load, and writes exactly this shape back via
// replaceState when a contest opens. Firebase Hosting rewrites /campus/** to
// the campusPreviewRouter Function, which serves the campus SPA shell for any
// path under it, so the link resolves in production even though there is no
// pre-rendered Next route for the [contestId] segment.
//
// ORIGIN IS READ AT CLICK TIME, never during render. This app is a static
// export - the HTML is built once, so baking in an origin would hardcode
// whatever machine built it, and reading window during render breaks
// SSR/hydration. Opening the sheet is a user gesture, so window is guaranteed.
//
// NOT A SECRET. Sharing the link does not share access. Institution contests
// are gated by firestore.rules to that institution's own approved students and
// further narrowed by targetScope, so a link forwarded to someone ineligible
// gets them a permission denial, not the contest.

const contestPath = (slug, contestId) => `/campus/${slug}/contest/${contestId}`;

// Every Campus URL is /campus/{slug}/... - both the workspace root
// (/campus/mrcet?tab=contests) and the deep link (/campus/mrcet/contest/{id})
// put the slug in the same position, so reading it back is reliable from
// either. Derived rather than threaded through as a prop because
// CampusContestDetails does not receive one, and adding it would mean editing
// campus-app.jsx's render tree for a value already present in the URL.
export function slugFromPath(pathname) {
  const parts = String(pathname || "").split("/").filter(Boolean);
  return parts[0] === "campus" && parts[1] ? parts[1] : "";
}

export function contestShareUrl(slug, contestId, origin) {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://devert.in");
  return `${base}${contestPath(slug, contestId)}`;
}

// Composed once and reused by every channel so the wording can't drift between
// WhatsApp and email.
function shareMessage(title, startText) {
  return startText
    ? `${title} - starts ${startText}. Register on DeVert Campus:`
    : `${title} - register on DeVert Campus:`;
}

export function ContestShareButton({ slug, contestId, title, startText, className = "", label = "share" }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const openSheet = () => {
    setUrl(contestShareUrl(slug || slugFromPath(window.location.pathname), contestId));
    setOpen(true);
  };

  return (
    <>
      <button onClick={openSheet} title="Share this contest"
        className={`text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-colors ${className}`}
        style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
        <Share2 size={14} /> {label}
      </button>
      {open && (
        <ContestShareSheet url={url} title={title} startText={startText} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ContestShareSheet({ url, title, startText, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const message = shareMessage(title, startText);
  const encodedUrl = encodeURIComponent(url);
  const encodedMsg = encodeURIComponent(message);

  const copy = async () => {
    try {
      // navigator.clipboard needs a secure context. It is present on https and
      // on localhost, but not on a plain-http LAN address - which is exactly
      // how a coordinator on the college network might open the admin panel.
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Don't claim success. Surfacing the raw URL for manual copy is more
      // useful than a checkmark that silently copied nothing.
      setCopyFailed(true);
    }
  };

  // Feature-detected inside the handler rather than at render: navigator.share
  // does not exist during the static build, so branching on it in JSX would
  // produce markup that disagrees with the client on hydration.
  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, text: message, url }); return; } catch { /* user dismissed */ }
    }
    copy();
  };

  const channels = [
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366", href: `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}` },
    { key: "telegram", label: "Telegram", icon: Send, color: "#229ED9", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}` },
    { key: "email", label: "Email", icon: Mail, color: CAMPUS.gold, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message}\n\n${url}`)}` },
  ];

  return (
    <div onClick={onClose} role="presentation"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Share contest"
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>

        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
          <Share2 size={14} style={{ color: CAMPUS.teal }} />
          <b className="text-[13.5px] flex-1 min-w-0" style={{ color: CAMPUS.ink }}>Share contest</b>
          <button onClick={onClose} aria-label="Close" style={{ color: CAMPUS.inkFaint }}><XIcon size={16} /></button>
        </div>

        <div className="p-5">
          <p className="text-[13px] font-semibold mb-0.5 line-clamp-2" style={{ color: CAMPUS.ink }}>{title}</p>
          {startText && <p className="text-[11.5px] mb-3.5" style={{ color: CAMPUS.inkFaint }}>Starts {startText}</p>}

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
            <Link2 size={13} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }} />
            <span className="text-[11.5px] font-mono truncate flex-1 min-w-0" style={{ color: CAMPUS.inkSoft }}>{url}</span>
          </div>

          <button onClick={copy}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-2.5 rounded-lg mb-2 transition-colors"
            style={copied
              ? { color: CAMPUS.good, background: CAMPUS.goodTint, border: `1px solid ${CAMPUS.good}50` }
              : { color: CAMPUS.teal, background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.teal}50` }}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
          </button>

          {copyFailed && (
            <p className="text-[11px] mb-2" style={{ color: CAMPUS.warn }}>
              Couldn&apos;t copy automatically - select the link above and copy it manually.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mb-2">
            {channels.map(c => (
              <a key={c.key} href={c.href} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-colors"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                <c.icon size={16} style={{ color: c.color }} />
                <span className="text-[10.5px] font-medium" style={{ color: CAMPUS.inkSoft }}>{c.label}</span>
              </a>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowQr(v => !v)}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-lg"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
              <QrCode size={13} /> {showQr ? "Hide QR" : "QR code"}
            </button>
            <button onClick={nativeShare}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-2 rounded-lg"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
              <Share2 size={13} /> More
            </button>
          </div>

          {showQr && (
            <div className="mt-3 flex flex-col items-center">
              {/* Always on a white plate with a dark foreground. A QR rendered
                  in theme colours fails to scan in dark mode - contrast and
                  polarity are what the scanner actually reads. */}
              <div className="p-3 rounded-xl" style={{ background: "#ffffff" }}>
                <QRCodeSVG value={url} size={168} level="M" fgColor="#0B1120" bgColor="#ffffff" />
              </div>
              <p className="text-[10.5px] mt-2 text-center" style={{ color: CAMPUS.inkFaint }}>
                Project this on screen - students scan to open the contest.
              </p>
            </div>
          )}

          <p className="text-[10.5px] mt-3 leading-relaxed" style={{ color: CAMPUS.inkFaint }}>
            Anyone with the link can open it, but only eligible students of this campus can register or take part.
          </p>
        </div>
      </div>
    </div>
  );
}
