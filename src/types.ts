/**
 * Mnemo Med — core domain types.
 *
 * These mirror the "Mnemosyne" memory/retrieval vocabulary:
 * Source objects, Evidence snippets, Retrieval ranking, Memory tags,
 * Weakness memory, Output memory, and source-locked generation.
 */

export type SourceType =
  | "lecture-notes"
  | "slides"
  | "textbook"
  | "professor-hint"
  | "graph-image"
  | "practice-question"
  | "lab"
  | "study-guide";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  "lecture-notes": "Lecture Notes",
  slides: "Slides",
  textbook: "Textbook Excerpt",
  "professor-hint": "Professor Hint",
  "graph-image": "Graph / Image",
  "practice-question": "Practice Question",
  lab: "Lab Material",
  "study-guide": "Study Guide",
};

export type Importance = 1 | 2 | 3 | 4 | 5;
export type Confidence = 1 | 2 | 3 | 4 | 5;

/** A single piece of study material (a "Source object" in Mnemosyne terms). */
export interface SourceMaterial {
  id: string;
  title: string;
  content: string;
  type: SourceType;
  lectureNumber: string;
  tags: string[];
  topics: string[];
  dateAdded: number;
  importance: Importance;
  /** When true, the original wording of this source must be preserved verbatim. */
  lockWording: boolean;
}

/** A highlighted, evidence-grade excerpt pulled from a source. */
export interface EvidenceSnippet {
  sourceId: string;
  sourceTitle: string;
  sourceType: SourceType;
  snippet: string;
  matchedKeywords: string[];
  tags: string[];
}

/** Evidence + a relevance score, returned by Mnemosyne Lite retrieval. */
export interface RetrievalResult extends EvidenceSnippet {
  score: number;
}

export type ModelTarget = "Claude" | "ChatGPT" | "Gemini" | "Local LLM";

export interface StudyProfile {
  courseName: string;
  professor: string;
  examName: string;
  examDate: string; // ISO yyyy-mm-dd
  topics: string[];
  difficulty: string;
  preferredModel: ModelTarget;
  studyGoal: string;
  studyHoursPerDay: number;
  gradingNotes: string;
  professorWordingNotes: string;
}

export type PromptMode =
  | "review-sheet"
  | "anki-cards"
  | "practice-questions"
  | "graph-image"
  | "verified-answer"
  | "weak-drill"
  | "cram-plan"
  | "explain-premed"
  | "professor-wording"
  | "practice-exam"
  | "missed-autopsy";

export const PROMPT_MODE_LABELS: Record<PromptMode, string> = {
  "review-sheet": "Review Sheet",
  "anki-cards": "Anki Cards",
  "practice-questions": "Practice Questions",
  "graph-image": "Graph / Image Analysis",
  "verified-answer": "Verified Answer Check",
  "weak-drill": "Weak Topic Drill",
  "cram-plan": "Finals Cram Plan",
  "explain-premed": "Explain Like I'm Premed",
  "professor-wording": "Professor Wording Parser",
  "practice-exam": "Practice Exam Builder",
  "missed-autopsy": "Missed Question Autopsy",
};

/** Global generation modes (the "culture" of every prompt). */
export interface ModeToggles {
  sourceLocked: boolean;
  preserveLanguage: boolean;
  premedReasoning: boolean;
  highYield: boolean;
  finalsCram: boolean;
  academicIntegrity: boolean;
}

export interface GeneratedPrompt {
  mode: PromptMode;
  text: string;
}

/** A tracked topic with weakness memory. */
export interface WeakTopic {
  id: string;
  topic: string;
  confidence: Confidence; // 1 (weak) .. 5 (strong)
  lastStudied?: number;
  missedQuestions: number;
  notes: string;
  /** Computed 0..100 priority — higher means study sooner. */
  priority?: number;
  nextAction: string;
}

export type ReviewGrade = "again" | "hard" | "good" | "easy";

/** A spaced-repetition flashcard with SM-2 scheduling state. */
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  sourceId?: string;
  deck: string;
  ease: number; // SM-2 ease factor (>= 1.3)
  intervalDays: number;
  reps: number; // current successful streak
  lapses: number;
  due: number; // timestamp when next due
  lastReviewed?: number;
  createdAt: number;
}

export interface OutputVaultItem {
  id: string;
  title: string;
  mode: PromptMode | "pasted-output";
  date: number;
  course: string;
  sourceIds: string[];
  content: string;
  tags: string[];
}

export interface MnemoSettings {
  defaultSourceLocked: boolean;
  defaultPreserveLanguage: boolean;
  defaultModel: ModelTarget;
  theme: "dark" | "light";
}

export type PageId =
  | "dashboard"
  | "profile"
  | "sources"
  | "prompt-lab"
  | "anki"
  | "practice"
  | "image"
  | "verified"
  | "flashcards"
  | "quiz"
  | "weakness"
  | "cram"
  | "vault"
  | "settings";

/** Full persisted application state. */
export interface AppState {
  profile: StudyProfile;
  sources: SourceMaterial[];
  weakTopics: WeakTopic[];
  outputs: OutputVaultItem[];
  flashcards: Flashcard[];
  settings: MnemoSettings;
  modes: ModeToggles;
}
