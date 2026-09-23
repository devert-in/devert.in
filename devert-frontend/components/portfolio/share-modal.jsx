"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";

export default function ShareModal({ handle, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = `https://devert.in/u/${handle}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
          onClick={e => e.stopPropagation()}
          className="terminal-window max-w-sm w-full">
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">share.sh</span>
            <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/70"><X size={14} /></button>
          </div>
          <div className="p-6 flex flex-col items-center">
            <div className="p-3 rounded-lg bg-white mb-4">
              <QRCodeSVG value={url} size={160} fgColor="#0a0a0a" bgColor="#ffffff" level="M" />
            </div>
            <p className="font-mono text-xs text-white/50 mb-4 text-center break-all">{url}</p>
            <button onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 font-mono text-xs py-2.5 border transition-all"
              style={copied
                ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }
                : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.05)" }}>
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check size={12} /> copied!</motion.span>
                  : <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Copy size={12} /> copy link</motion.span>}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
