"use client";

// Honest runtime status line for pages that execute code (design §6/§8):
// python boots a Pyodide worker lazily on first mount here, javascript is
// always instantly available (sandboxed worker, no boot), and the Piston
// queue depth for java/c/cpp is polled so students see queueing instead of
// a silent hang under load.

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle, Server } from "lucide-react";
import { cn, NeonBadge } from "@/components/prep/ui";
import { preloadPython, pistonQueueInfo } from "@/lib/prep/judge";

export default function RuntimeStatus({ className }) {
  const [pyState, setPyState] = useState("booting"); // booting | ready | error
  const [pistonInfo, setPistonInfo] = useState({ active: 0, queued: 0 });
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    preloadPython()
      .then(() => setPyState("ready"))
      .catch(() => setPyState("error"));
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setPistonInfo(pistonQueueInfo()), 700);
    return () => clearInterval(iv);
  }, []);

  const pistonBusy = pistonInfo.active > 0 || pistonInfo.queued > 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <NeonBadge color={pyState === "ready" ? "#00FF41" : pyState === "error" ? "#FF3B3B" : "#FFD700"}>
        {pyState === "booting" && <Loader2 size={9} className="animate-spin" />}
        {pyState === "ready" && <CheckCircle2 size={9} />}
        {pyState === "error" && <AlertTriangle size={9} />}
        PYTHON_RT: {pyState === "booting" ? "booting…" : pyState === "ready" ? "ready" : "failed"}
      </NeonBadge>
      <NeonBadge color={pistonBusy ? "#FF9500" : "#00FFFF"}>
        <Server size={9} />
        PISTON: {pistonInfo.active > 0 ? `running ${pistonInfo.active}` : "idle"}
        {pistonInfo.queued > 0 ? ` · queued ${pistonInfo.queued}` : ""}
      </NeonBadge>
    </div>
  );
}
