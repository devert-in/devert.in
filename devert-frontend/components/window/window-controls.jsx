"use client";

import { Minus, Square, X } from "lucide-react";

function ControlDot({ color, Icon, label, onClick }) {
  return (
    <button
      type="button"
      data-window-control
      onClick={onClick}
      aria-label={label}
      className="group relative w-[10px] h-[10px] rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ background: color }}
    >
      <Icon
        size={7}
        strokeWidth={3}
        className="opacity-0 group-hover:opacity-70 transition-opacity"
        style={{ color: "rgba(0,0,0,0.7)" }}
      />
    </button>
  );
}

export function WindowControls({ onMinimize, onToggleMaximize, onClose, maximized }) {
  return (
    <div className="flex items-center gap-[6px]">
      <ControlDot color="#FF5050" Icon={X} label="Close" onClick={onClose} />
      <ControlDot color="#FF9500" Icon={Minus} label="Minimize" onClick={onMinimize} />
      <ControlDot color="#00FF41" Icon={Square} label={maximized ? "Restore" : "Maximize"} onClick={onToggleMaximize} />
    </div>
  );
}
