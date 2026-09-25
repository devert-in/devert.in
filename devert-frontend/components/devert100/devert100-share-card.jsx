"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Linkedin, Copy, Check, X, Loader2 } from "lucide-react";
import { DEVERT100_TOTAL_DAYS, computeStreaks, formatDayDate, problemLabel } from "@/lib/devert100";

// The completion card.
//
// DRAWN ON A CANVAS, not rasterised from DOM. html2canvas would mean a new
// dependency, a second rendering engine's idea of how the page looks, and
// webfont races that silently produce a card in the fallback font. Canvas 2D
// is a few dozen lines here, renders identically everywhere, and is the only
// approach that can guarantee the exact pixel size LinkedIn wants.
//
// 1200x630 is LinkedIn's link-preview ratio and reads correctly in the feed;
// drawn at 2x and scaled down so it stays sharp on retina and when LinkedIn
// re-compresses it.
const W = 1200;
const H = 630;
const SCALE = 2;

const BG = "#05070c";
const GREEN = "#00FF41";
const CYAN = "#00FFFF";
const DIFFICULTY_COLOR = { Easy: "#00FF41", Medium: "#FF9500", Hard: "#FF5050" };

// Canvas has no text wrapping, so this is the whole of it: greedily pack words
// and hard-truncate the last line rather than letting a long problem name run
// off the edge of the card.
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.length) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}...`).width > maxWidth) last = last.slice(0, -1);
    const joined = lines.slice(0, -1).join(" ") + " " + last;
    if (joined.replace(/\s+/g, " ").trim() !== String(text).replace(/\s+/g, " ").trim()) {
      lines[maxLines - 1] = `${last}...`;
    }
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(canvas, { day, problem, topic, streak, completed, name }) {
  const ctx = canvas.getContext("2d");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  ctx.scale(SCALE, SCALE);

  const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const sans = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

  // plate
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // A faint grid, echoing the site's own .grid-bg, so the card reads as DeVert
  // rather than as a generic dark rectangle.
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // accent edge
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, 6, H);

  const PAD = 64;

  // brand
  ctx.font = `600 20px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("DEVERT 100", PAD, PAD + 8);

  ctx.font = `500 16px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  const dateLabel = formatDayDate(day);
  ctx.fillText(dateLabel, W - PAD - ctx.measureText(dateLabel).width, PAD + 7);

  // day number - the thing the card is actually about
  ctx.font = `800 128px ${sans}`;
  ctx.fillStyle = "#ffffff";
  const dayText = `DAY ${day}`;
  ctx.fillText(dayText, PAD, 220);
  const dayW = ctx.measureText(dayText).width;

  ctx.font = `600 34px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText(`/ ${DEVERT100_TOTAL_DAYS}`, PAD + dayW + 18, 220);

  // completed pill, then the problem's catalogue number beside it - "LC 283"
  // is how a developer recognises a problem at a glance, and a share card that
  // omits it makes the reader go look it up.
  ctx.font = `700 17px ${mono}`;
  const pill = "COMPLETED";
  const pillW = ctx.measureText(pill).width + 34;
  ctx.fillStyle = "rgba(0,255,65,0.12)";
  roundRect(ctx, PAD, 246, pillW, 38, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,255,65,0.4)";
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.fillText(pill, PAD + 17, 271);

  const lcLabel = problemLabel(problem);
  if (lcLabel) {
    const lcW = ctx.measureText(lcLabel).width + 34;
    const lcX = PAD + pillW + 12;
    ctx.fillStyle = "rgba(0,255,255,0.10)";
    roundRect(ctx, lcX, 246, lcW, 38, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,255,255,0.35)";
    ctx.stroke();
    ctx.fillStyle = CYAN;
    ctx.fillText(lcLabel, lcX + 17, 271);
  }

  // problem name
  ctx.font = `700 44px ${sans}`;
  ctx.fillStyle = "#ffffff";
  const lines = wrapText(ctx, problem?.name || "", W - PAD * 2, 2);
  lines.forEach((l, i) => ctx.fillText(l, PAD, 350 + i * 54));

  const afterTitle = 350 + lines.length * 54;

  // meta chips
  ctx.font = `500 18px ${mono}`;
  let cx = PAD;
  const chips = [
    { text: topic || "", color: "rgba(255,255,255,0.5)" },
    { text: problem?.pattern || "", color: CYAN },
    { text: problem?.difficulty || "", color: DIFFICULTY_COLOR[problem?.difficulty] || "rgba(255,255,255,0.5)" },
  ].filter(c => c.text);
  for (const chip of chips) {
    const w = ctx.measureText(chip.text).width;
    if (cx + w > W - PAD) break;
    ctx.fillStyle = chip.color;
    ctx.fillText(chip.text, cx, afterTitle + 14);
    cx += w + 26;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    if (chip !== chips[chips.length - 1]) ctx.fillText("·", cx - 17, afterTitle + 14);
  }

  // footer stats
  const FY = H - 96;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.moveTo(PAD, FY - 28); ctx.lineTo(W - PAD, FY - 28); ctx.stroke();

  const stats = [
    { label: "COMPLETED", value: `${completed}/${DEVERT100_TOTAL_DAYS}`, color: GREEN },
    { label: "STREAK", value: `${streak}`, color: "#FF6430" },
  ];
  let sx = PAD;
  for (const s of stats) {
    ctx.font = `500 13px ${mono}`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(s.label, sx, FY + 2);
    ctx.font = `700 32px ${sans}`;
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, sx, FY + 38);
    sx += 200;
  }

  // name, only if we have one - never a placeholder
  if (name) {
    ctx.font = `500 18px ${mono}`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    const nw = ctx.measureText(name).width;
    ctx.fillText(name, W - PAD - nw, FY + 2);
  }
  ctx.font = `600 18px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  const url = "devert.in/devert100";
  ctx.fillText(url, W - PAD - ctx.measureText(url).width, FY + 36);
}

export function Devert100ShareCard({ day, problem, topic, participant, displayName, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [ready, setReady] = useState(false);

  const completedDays = participant?.completedDays || {};
  const { current: streak, total: completed } = computeStreaks(completedDays);

  const postText =
`Day ${day}/${DEVERT100_TOTAL_DAYS} of #DeVert100

Today I solved: ${problem?.name || ""}${problemLabel(problem) ? ` (${problemLabel(problem)})` : ""}
Pattern: ${problem?.pattern || topic || ""}
${streak > 1 ? `\n${streak} days in a row.` : ""}
One more day of consistency. One step closer to becoming a better problem solver.

#DeVert100 #DeVert #DSA #Java #Coding #100DaysOfCode`.replace(/\n{3,}/g, "\n\n");

  // A day whose deep dive carries an authored LinkedIn post uses that; the
  // generated one is the fallback for the 99 days without one. Either way the
  // textarea stays editable - nobody should post words they did not choose.
  const authored = String(problem?.deepDive?.linkedin || "").trim();
  const [text, setText] = useState(authored || postText);

  useEffect(() => {
    // Fonts have to be settled before the first measureText, or the card draws
    // once in the fallback face and never redraws.
    let cancelled = false;
    const draw = () => {
      if (cancelled || !canvasRef.current) return;
      drawCard(canvasRef.current, { day, problem, topic, streak, completed, name: displayName });
      setReady(true);
    };
    if (document.fonts?.ready) document.fonts.ready.then(draw).catch(draw);
    else draw();
    return () => { cancelled = true; };
  }, [day, problem, topic, streak, completed, displayName]);

  function handleDownload() {
    if (!canvasRef.current) return;
    setDownloading(true);
    canvasRef.current.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `devert100-day-${day}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setDownloading(false);
    }, "image/png");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked; the textarea is selectable */ }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(3,5,9,0.85)" }} onClick={onClose}>
      <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="terminal-window w-full sm:max-w-2xl my-auto" style={{ borderColor: `${GREEN}35` }}>
        <div className="terminal-header flex items-center">
          <span className="font-mono text-[10px] text-white/25 ml-2">share_day_{day}</span>
          <button onClick={onClose} className="ml-auto mr-2 text-white/30 hover:text-white/70"><X size={14} /></button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded overflow-hidden mb-4" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <canvas ref={canvasRef} className="w-full h-auto block"
              style={{ aspectRatio: `${W} / ${H}`, background: BG }} />
          </div>

          <label className="block font-mono text-[10px] text-white/40 tracking-wider mb-2">POST TEXT - EDIT BEFORE YOU SHARE</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
            className="w-full mb-4 px-3 py-2.5 rounded font-mono text-[11px] text-white/80 outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />

          <div className="grid sm:grid-cols-3 gap-2">
            <button onClick={handleDownload} disabled={!ready || downloading}
              className="py-3 rounded font-mono text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: GREEN, color: "#05080F" }}>
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} DOWNLOAD
            </button>
            <button onClick={handleCopy}
              className="py-3 rounded font-mono text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 text-white/75"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              {copied ? <Check size={13} style={{ color: GREEN }} /> : <Copy size={13} />} {copied ? "COPIED" : "COPY TEXT"}
            </button>
            <a href="https://www.linkedin.com/feed/?shareActive=true" target="_blank" rel="noopener noreferrer"
              className="py-3 rounded font-mono text-[11px] font-semibold inline-flex items-center justify-center gap-1.5"
              style={{ background: "#0A66C2", color: "#fff" }}>
              <Linkedin size={13} /> LINKEDIN
            </a>
          </div>

          {/* Said plainly rather than implied. LinkedIn's share endpoints take a
              URL, not an image a page generated - there is no API flow that
              uploads this PNG for a signed-out third-party site, so pretending
              otherwise would just produce a broken post. */}
          <p className="font-mono text-[10px] text-white/28 leading-relaxed mt-3">
            LinkedIn cannot accept an image straight from a webpage. Download the card, copy the
            text, then attach the image in LinkedIn&apos;s composer.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
