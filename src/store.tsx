import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AISettings,
  AppState,
  Flashcard,
  MnemoSettings,
  ModeToggles,
  OutputVaultItem,
  PageId,
  ReviewGrade,
  SourceMaterial,
  StudyProfile,
  WeakTopic,
} from "./types";
import { loadFromStorage, saveToStorage, clearStorage } from "./lib/storage";
import { reviewCard } from "./lib/srs";
import { sampleState } from "./data/sampleData";

/**
 * Merge persisted state with current defaults so data saved by older versions
 * (e.g. v1, which had no flashcards) keeps loading after upgrades.
 */
function normalize(loaded: AppState | null): AppState {
  const base = sampleState();
  if (!loaded) return base;
  return {
    ...base,
    ...loaded,
    profile: { ...base.profile, ...loaded.profile },
    settings: { ...base.settings, ...loaded.settings },
    modes: { ...base.modes, ...loaded.modes },
    sources: loaded.sources ?? [],
    weakTopics: loaded.weakTopics ?? [],
    outputs: loaded.outputs ?? [],
    flashcards: loaded.flashcards ?? [],
    ai: { ...base.ai, ...(loaded.ai ?? {}) },
  };
}

interface StoreContextValue {
  state: AppState;
  page: PageId;
  setPage: (p: PageId) => void;

  setProfile: (patch: Partial<StudyProfile>) => void;
  setModes: (patch: Partial<ModeToggles>) => void;
  setSettings: (patch: Partial<MnemoSettings>) => void;
  setAI: (patch: Partial<AISettings>) => void;

  addSource: (s: SourceMaterial) => void;
  updateSource: (id: string, patch: Partial<SourceMaterial>) => void;
  removeSource: (id: string) => void;

  upsertWeak: (t: WeakTopic) => void;
  removeWeak: (id: string) => void;

  addOutput: (o: OutputVaultItem) => void;
  removeOutput: (id: string) => void;

  addCards: (cards: Flashcard[]) => void;
  updateCard: (id: string, patch: Partial<Flashcard>) => void;
  removeCard: (id: string) => void;
  reviewFlashcard: (id: string, grade: ReviewGrade) => void;

  importData: (state: AppState) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => normalize(loadFromStorage()));
  const [page, setPage] = useState<PageId>("dashboard");

  // Persist on every change (debounce-free; payloads are small).
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Apply theme to <html>.
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [state.settings.theme]);

  const value = useMemo<StoreContextValue>(() => {
    return {
      state,
      page,
      setPage,

      setProfile: (patch) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
      setModes: (patch) => setState((s) => ({ ...s, modes: { ...s.modes, ...patch } })),
      setSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      setAI: (patch) => setState((s) => ({ ...s, ai: { ...s.ai, ...patch } })),

      addSource: (src) => setState((s) => ({ ...s, sources: [src, ...s.sources] })),
      updateSource: (id, patch) =>
        setState((s) => ({
          ...s,
          sources: s.sources.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeSource: (id) => setState((s) => ({ ...s, sources: s.sources.filter((x) => x.id !== id) })),

      upsertWeak: (t) =>
        setState((s) => {
          const exists = s.weakTopics.some((x) => x.id === t.id);
          return {
            ...s,
            weakTopics: exists ? s.weakTopics.map((x) => (x.id === t.id ? t : x)) : [...s.weakTopics, t],
          };
        }),
      removeWeak: (id) => setState((s) => ({ ...s, weakTopics: s.weakTopics.filter((x) => x.id !== id) })),

      addOutput: (o) => setState((s) => ({ ...s, outputs: [o, ...s.outputs] })),
      removeOutput: (id) => setState((s) => ({ ...s, outputs: s.outputs.filter((x) => x.id !== id) })),

      addCards: (cards) => setState((s) => ({ ...s, flashcards: [...cards, ...s.flashcards] })),
      updateCard: (id, patch) =>
        setState((s) => ({
          ...s,
          flashcards: s.flashcards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCard: (id) => setState((s) => ({ ...s, flashcards: s.flashcards.filter((c) => c.id !== id) })),
      reviewFlashcard: (id, grade) =>
        setState((s) => ({
          ...s,
          flashcards: s.flashcards.map((c) => (c.id === id ? reviewCard(c, grade) : c)),
        })),

      importData: (next) => setState(normalize(next)),
      resetData: () => {
        clearStorage();
        setState(sampleState());
        setPage("dashboard");
      },
    };
  }, [state, page]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
