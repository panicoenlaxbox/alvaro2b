"use client";

import { useEffect, useRef, useState } from "react";
import { drawTicks } from "@/lib/domain/draw";
import { pickRandom } from "@/lib/domain/explore";

const DRAW_MS = 2800;
const STEPS = 16;
const PHRASE_MS = 900;
const REDUCED_MOTION_MS = 700;

/**
 * A random pick with some suspense: names flicker and slow down while `phrases` rotate, then the
 * result stays. With reduced motion it is a short pause without flickering.
 */
export function useDraw<T>(items: T[], phrases: string[]) {
  const [phase, setPhase] = useState<"idle" | "drawing" | "done">("idle");
  const [shown, setShown] = useState<T | null>(null);
  const [phrase, setPhrase] = useState("");
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  function start() {
    clear();
    const result = pickRandom(items);
    if (result === null) return;
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? REDUCED_MOTION_MS : DRAW_MS;
    const order = [...phrases].sort(() => Math.random() - 0.5);
    setPhase("drawing");
    setShown(null);
    setPhrase(order[0] ?? "");
    for (let at = PHRASE_MS, i = 1; at < total; at += PHRASE_MS, i++) later(at, () => setPhrase(order[i % order.length] ?? ""));

    if (!reduced) {
      let at = 0;
      for (const tick of drawTicks(DRAW_MS, STEPS)) {
        later(at, () => setShown(pickRandom(items)));
        at += tick;
      }
    }
    later(total, () => {
      setShown(result);
      setPhase("done");
    });
  }

  return { phase, shown, phrase, start };
}
