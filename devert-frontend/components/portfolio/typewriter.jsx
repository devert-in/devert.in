"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Cycles through a list of words, typing/deleting letter by letter, with a
// blinking cursor - ported from nandhakishor-portfolio's TypeWriter.
export function TypeWriter({ words, color = "#00FFFF", speed = 55, pause = 1400 }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words?.length) return;
    const current = words[wordIndex % words.length];
    let timeout;

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIndex(i => i + 1);
    } else {
      timeout = setTimeout(() => {
        setText(current.slice(0, text.length + (deleting ? -1 : 1)));
      }, deleting ? speed / 2 : speed);
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIndex, words, speed, pause]);

  return (
    <span style={{ color }}>
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle"
        style={{ background: color }}
      />
    </span>
  );
}
