import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AppState,
  MnemoSettings,
  ModeToggles,
  OutputVaultItem,
  PageId,
  SourceMaterial,
  StudyProfile,
  WeakTopic,
} from "./types";
import { loadFromStorage, saveToStorage, clearStorage } from "./lib/storage";
import { sampleState } from "./data/sampleData";

interface StoreContextValue {
  state: AppState;
  page: PageId;
  setPage: (p: PageId) => void;

  setProfile: (patch: Partial<StudyProfile>) => void;
  setModes: (patch: Partial<ModeToggles>) => void;
  setSettings: (patch: Partial<MnemoSettings>) => void;

  addSource: (s: SourceMaterial) => void;
  updateSource: (id: string, patch: Partial<SourceMaterial>) => void;
  removeSource: (id: string) => void;

  upsertWeak: (t: WeakTopic) => void;
  removeWeak: (id: string) => void;

  addOutput: (o: OutputVaultItem) => void;
  removeOutput: (id: string) => void;

  importData: (state: AppState) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadFromStorage() ?? sampleState());
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

      importData: (next) => setState(next),
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
