import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AISettings,
  AppState,
  Course,
  CourseSummary,
  Flashcard,
  MnemoSettings,
  ModeToggles,
  OutputVaultItem,
  PageId,
  PersistedState,
  ReviewGrade,
  SourceMaterial,
  StudyProfile,
  WeakTopic,
} from "./types";
import { loadFromStorage, saveToStorage, clearStorage, uid } from "./lib/storage";
import { reviewCard } from "./lib/srs";
import { sampleState, emptyProfile, blankCourse } from "./data/sampleData";
import { exportJSON } from "./lib/exporters";

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeCourse(c: any, model: AISettings["provider"] | undefined): Course {
  const empty = emptyProfile();
  return {
    id: typeof c?.id === "string" ? c.id : uid("course_"),
    profile: { ...empty, ...(c?.profile ?? {}) },
    sources: Array.isArray(c?.sources) ? c.sources : [],
    weakTopics: Array.isArray(c?.weakTopics) ? c.weakTopics : [],
    outputs: Array.isArray(c?.outputs) ? c.outputs : [],
    flashcards: Array.isArray(c?.flashcards) ? c.flashcards : [],
  };
}

/**
 * Accept any persisted shape — new multi-course, old single-course (v1/v2), or
 * the sample seed — and produce a normalized PersistedState. This is the
 * migration seam that keeps existing local data loading after the v3 upgrade.
 */
function normalize(loaded: any): PersistedState {
  const base = sampleState(); // flat sample (one course's worth + globals)

  const settings: MnemoSettings = { ...base.settings, ...(loaded?.settings ?? {}) };
  const modes: ModeToggles = { ...base.modes, ...(loaded?.modes ?? {}) };
  const ai: AISettings = { ...base.ai, ...(loaded?.ai ?? {}) };

  let courses: Course[];
  let activeCourseId: string;

  if (loaded && Array.isArray(loaded.courses) && loaded.courses.length) {
    courses = loaded.courses.map((c: any) => normalizeCourse(c, undefined));
    activeCourseId =
      typeof loaded.activeCourseId === "string" && courses.some((c) => c.id === loaded.activeCourseId)
        ? loaded.activeCourseId
        : courses[0].id;
  } else if (loaded && (loaded.profile || loaded.sources)) {
    // Old single-course shape → wrap into one course.
    courses = [normalizeCourse(loaded, undefined)];
    activeCourseId = courses[0].id;
  } else {
    // Nothing usable → seed from the sample course.
    courses = [normalizeCourse(base, undefined)];
    activeCourseId = courses[0].id;
  }

  return { courses, activeCourseId, settings, modes, ai };
}

function activeCourse(p: PersistedState): Course {
  return p.courses.find((c) => c.id === p.activeCourseId) ?? p.courses[0];
}

/** Flatten the active course + globals into the AppState view pages consume. */
function viewOf(p: PersistedState): AppState {
  const c = activeCourse(p);
  return {
    profile: c.profile,
    sources: c.sources,
    weakTopics: c.weakTopics,
    outputs: c.outputs,
    flashcards: c.flashcards,
    settings: p.settings,
    modes: p.modes,
    ai: p.ai,
  };
}

interface StoreContextValue {
  state: AppState;
  page: PageId;
  setPage: (p: PageId) => void;

  // Multi-course (v3)
  courses: CourseSummary[];
  activeCourseId: string;
  setActiveCourse: (id: string) => void;
  addCourse: () => void;
  removeCourse: (id: string) => void;

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

  exportData: () => void;
  importData: (state: unknown) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(() => normalize(loadFromStorage() ?? sampleState()));
  const [page, setPage] = useState<PageId>("dashboard");

  useEffect(() => {
    saveToStorage(persisted);
  }, [persisted]);

  // Apply theme to <html>.
  useEffect(() => {
    const root = document.documentElement;
    if (persisted.settings.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [persisted.settings.theme]);

  const state = useMemo(() => viewOf(persisted), [persisted]);

  const value = useMemo<StoreContextValue>(() => {
    // Update the active course in place.
    const patchActive = (fn: (c: Course) => Course) =>
      setPersisted((p) => ({ ...p, courses: p.courses.map((c) => (c.id === p.activeCourseId ? fn(c) : c)) }));

    return {
      state,
      page,
      setPage,

      courses: persisted.courses.map((c) => ({ id: c.id, name: c.profile.courseName || "Untitled course" })),
      activeCourseId: persisted.activeCourseId,
      setActiveCourse: (id) => setPersisted((p) => ({ ...p, activeCourseId: id })),
      addCourse: () =>
        setPersisted((p) => {
          const c = blankCourse(p.settings.defaultModel);
          return { ...p, courses: [...p.courses, c], activeCourseId: c.id };
        }),
      removeCourse: (id) =>
        setPersisted((p) => {
          const remaining = p.courses.filter((c) => c.id !== id);
          const courses = remaining.length ? remaining : [blankCourse(p.settings.defaultModel)];
          const activeCourseId = id === p.activeCourseId ? courses[0].id : p.activeCourseId;
          return { ...p, courses, activeCourseId };
        }),

      setProfile: (patch) => patchActive((c) => ({ ...c, profile: { ...c.profile, ...patch } })),
      setModes: (patch) => setPersisted((p) => ({ ...p, modes: { ...p.modes, ...patch } })),
      setSettings: (patch) => setPersisted((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
      setAI: (patch) => setPersisted((p) => ({ ...p, ai: { ...p.ai, ...patch } })),

      addSource: (src) => patchActive((c) => ({ ...c, sources: [src, ...c.sources] })),
      updateSource: (id, patch) =>
        patchActive((c) => ({ ...c, sources: c.sources.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSource: (id) => patchActive((c) => ({ ...c, sources: c.sources.filter((x) => x.id !== id) })),

      upsertWeak: (t) =>
        patchActive((c) => {
          const exists = c.weakTopics.some((x) => x.id === t.id);
          return { ...c, weakTopics: exists ? c.weakTopics.map((x) => (x.id === t.id ? t : x)) : [...c.weakTopics, t] };
        }),
      removeWeak: (id) => patchActive((c) => ({ ...c, weakTopics: c.weakTopics.filter((x) => x.id !== id) })),

      addOutput: (o) => patchActive((c) => ({ ...c, outputs: [o, ...c.outputs] })),
      removeOutput: (id) => patchActive((c) => ({ ...c, outputs: c.outputs.filter((x) => x.id !== id) })),

      addCards: (cards) => patchActive((c) => ({ ...c, flashcards: [...cards, ...c.flashcards] })),
      updateCard: (id, patch) =>
        patchActive((c) => ({ ...c, flashcards: c.flashcards.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeCard: (id) => patchActive((c) => ({ ...c, flashcards: c.flashcards.filter((x) => x.id !== id) })),
      reviewFlashcard: (id, grade) =>
        patchActive((c) => ({ ...c, flashcards: c.flashcards.map((x) => (x.id === id ? reviewCard(x, grade) : x)) })),

      exportData: () => exportJSON(persisted),
      importData: (next) => setPersisted(normalize(next)),
      resetData: () => {
        clearStorage();
        setPersisted(normalize(sampleState()));
        setPage("dashboard");
      },
    };
  }, [persisted, state, page]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
