import { useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

const SHOW_RESULT_FOR = 2000;

/** Copies text and says for a moment how that went. */
export function useCopy(text: string): { state: CopyState; copy: () => Promise<void> } {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), SHOW_RESULT_FOR);
  }

  return { state, copy };
}
