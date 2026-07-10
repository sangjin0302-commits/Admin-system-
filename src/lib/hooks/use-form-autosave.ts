"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ethos.intake.draft";
const DEBOUNCE_MS = 3_000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days

type DraftEnvelope<T> = {
  data: T;
  savedAt: number;
};

export function useFormAutosave<T>(formState: T, enabled: boolean) {
  const [draft, setDraft] = useState<T | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRestoredRef = useRef(false);

  // On mount, check for existing draft
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const envelope = JSON.parse(raw) as DraftEnvelope<T>;
      if (Date.now() - envelope.savedAt > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setDraft(envelope.data);
      setHasDraft(true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [enabled]);

  // Debounced save
  useEffect(() => {
    if (!enabled || !draftRestoredRef.current && hasDraft) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const envelope: DraftEnvelope<T> = {
          data: formState,
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formState, enabled, hasDraft]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDraft(null);
    setHasDraft(false);
  }, []);

  const restoreDraft = useCallback(() => {
    draftRestoredRef.current = true;
    setHasDraft(false);
    return draft;
  }, [draft]);

  const dismissDraft = useCallback(() => {
    draftRestoredRef.current = true;
    setDraft(null);
    setHasDraft(false);
  }, []);

  return { draft, hasDraft, clearDraft, restoreDraft, dismissDraft };
}
