import { useEffect, useRef } from 'react';

/**
 * Phone back button support. A screen that has an inner step (a sub-screen, an open form, a photo viewer ...)
 * registers a handler while that step is open. Pressing Back runs the most recent handler with the highest
 * priority; only when there is none does the app go to the previous tab, and finally leave.
 */
interface Entry {
  id: number;
  priority: number;
  fn: () => void;
}

let nextId = 1;
const entries: Entry[] = [];

/** Returns true when a screen handled the back press. */
export function runBackHandlers(): boolean {
  if (!entries.length) return false;
  let best = entries[0];
  for (const e of entries) {
    if (e.priority >= best.priority) best = e; // later entries win ties
  }
  best.fn();
  return true;
}

/** While `active` is true, Back calls `fn` first. Inner steps use the default priority (10); tab history uses 0. */
export function useBackHandler(active: boolean, fn: () => void, priority = 10): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const entry: Entry = { id: nextId++, priority, fn: () => ref.current() };
    entries.push(entry);
    return () => {
      const i = entries.findIndex((e) => e.id === entry.id);
      if (i >= 0) entries.splice(i, 1);
    };
  }, [active, priority]);
}
