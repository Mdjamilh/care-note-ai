"use client";

import { useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Debounced autosave. Calls `save` once `value` has been stable for `delayMs`,
 * never runs two saves at once, and re-saves if edits land mid-save.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<boolean>,
  { delayMs = 800, enabled = true }: { delayMs?: number; enabled?: boolean } = {},
): SaveState {
  const [state, setState] = useState<SaveState>("idle");
  const lastSaved = useRef(JSON.stringify(value));
  const inFlight = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastSaved.current) return;

    setState("dirty");
    const timer = setTimeout(async function run() {
      if (inFlight.current) {
        setTimeout(run, delayMs);
        return;
      }
      inFlight.current = true;
      setState("saving");
      const ok = await saveRef.current(value);
      inFlight.current = false;
      if (ok) lastSaved.current = serialized;
      setState(ok ? "saved" : "error");
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, enabled]);

  return state;
}
