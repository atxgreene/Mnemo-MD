import type { AppState, Course, ModelTarget, StudyProfile } from "../types";
import { uid } from "../lib/storage";

/** An empty course profile for new courses. */
export function emptyProfile(model: ModelTarget = "Claude"): StudyProfile {
  return {
    courseName: "",
    professor: "",
    examName: "",
    examDate: "",
    topics: [],
    difficulty: "Standard exam level",
    preferredModel: model,
    studyGoal: "",
    studyHoursPerDay: 3,
    gradingNotes: "",
    professorWordingNotes: "",
  };
}

/** A fresh, empty course. */
export function blankCourse(model: ModelTarget = "Claude"): Course {
  return { id: uid("course_"), profile: emptyProfile(model), sources: [], weakTopics: [], outputs: [], flashcards: [] };
}

/**
 * Default seed data so the app is immediately useful on first run.
 * Example course: Cell Biology Final.
 */
export function sampleState(): AppState {
  const now = Date.now();
  const day = 86_400_000;

  return {
    profile: {
      courseName: "Cell & Molecular Medicine",
      professor: "Dr. Example",
      examName: "Block 1 Exam",
      examDate: isoInDays(10),
      topics: [
        "membrane transport",
        "cell signaling",
        "mitochondria",
        "DNA replication",
        "transcription",
        "translation",
        "cell cycle",
        "apoptosis",
      ],
      difficulty: "Challenging — integration & application",
      preferredModel: "Claude",
      studyGoal: "Score 90%+ and solidify weak mechanisms.",
      studyHoursPerDay: 3,
      gradingNotes: "Heavy on mechanisms and 'which statement is false' questions.",
      professorWordingNotes:
        "Dr. Example wants exact textbook definitions for transport and the cell cycle checkpoints.",
    },
    sources: [
      {
        id: uid("src_"),
        title: "Lecture 4 — Membrane Transport",
        content:
          "Passive transport moves molecules down their concentration gradient without ATP. " +
          "Active transport requires energy input and can move molecules against their concentration gradient. " +
          "The sodium-potassium pump uses ATP to move 3 Na+ out and 2 K+ in.",
        type: "lecture-notes",
        lectureNumber: "4",
        tags: ["transport", "atp", "gradient"],
        topics: ["membrane transport"],
        dateAdded: now - 6 * day,
        importance: 5,
        lockWording: true,
      },
      {
        id: uid("src_"),
        title: "Lecture 7 — Cell Signaling (GPCRs)",
        content:
          "G-protein coupled receptors (GPCRs) are seven-transmembrane receptors. Ligand binding activates a " +
          "heterotrimeric G protein by exchanging GDP for GTP on the alpha subunit. Gs stimulates adenylyl cyclase " +
          "to raise cAMP; Gi inhibits it. cAMP activates protein kinase A (PKA). Signal is terminated by GTP hydrolysis.",
        type: "lecture-notes",
        lectureNumber: "7",
        tags: ["gpcr", "signaling", "camp", "pka"],
        topics: ["cell signaling"],
        dateAdded: now - 4 * day,
        importance: 4,
        lockWording: false,
      },
      {
        id: uid("src_"),
        title: "Slides — Oxidative Phosphorylation",
        content:
          "The electron transport chain (Complexes I–IV) pumps protons into the intermembrane space, creating a " +
          "proton-motive force. ATP synthase (Complex V) uses this gradient to phosphorylate ADP to ATP. " +
          "Oxygen is the final electron acceptor, forming water. ~32 ATP per glucose via oxidative phosphorylation.",
        type: "slides",
        lectureNumber: "9",
        tags: ["etc", "atp-synthase", "mitochondria"],
        topics: ["mitochondria"],
        dateAdded: now - 2 * day,
        importance: 5,
        lockWording: false,
      },
      {
        id: uid("src_"),
        title: "Professor Hint — Cell Cycle Checkpoints",
        content:
          "Dr. Example emphasized: 'The G1/S checkpoint is the restriction point — it checks DNA integrity and " +
          "growth signals before commitment to replication. The G2/M checkpoint verifies DNA replication is complete " +
          "and undamaged. The spindle (M) checkpoint ensures kinetochores are attached before anaphase.' Know these verbatim.",
        type: "professor-hint",
        lectureNumber: "11",
        tags: ["checkpoints", "cell-cycle", "exam-hint"],
        topics: ["cell cycle"],
        dateAdded: now - 1 * day,
        importance: 5,
        lockWording: true,
      },
    ],
    weakTopics: [
      {
        id: uid("wk_"),
        topic: "oxidative phosphorylation",
        confidence: 2,
        missedQuestions: 4,
        notes: "Mixing up which complex pumps protons vs. accepts electrons.",
        nextAction: "Drill ETC complexes + make a pathway-order Anki deck.",
        lastStudied: now - 5 * day,
      },
      {
        id: uid("wk_"),
        topic: "G-protein coupled receptors",
        confidence: 2,
        missedQuestions: 3,
        notes: "Gs vs Gi effects on cAMP keep flipping.",
        nextAction: "Compare/contrast card: Gs vs Gi vs Gq.",
        lastStudied: now - 3 * day,
      },
      {
        id: uid("wk_"),
        topic: "cell cycle checkpoints",
        confidence: 3,
        missedQuestions: 1,
        notes: "Need professor's exact checkpoint definitions.",
        nextAction: "Memorize verbatim from Lecture 11 hint.",
        lastStudied: now - 2 * day,
      },
    ],
    outputs: [],
    flashcards: [
      {
        id: uid("card_"),
        front: "What does the sodium-potassium pump move, and at what ratio?",
        back: "3 Na⁺ out and 2 K⁺ in, using ATP (active transport against the gradient).",
        tags: ["membrane transport"],
        deck: "Cell Biology Final",
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
        due: now,
        createdAt: now - 6 * day,
      },
      {
        id: uid("card_"),
        front: "Gs vs. Gi: effect on adenylyl cyclase and cAMP?",
        back: "Gs stimulates adenylyl cyclase → raises cAMP. Gi inhibits it → lowers cAMP. cAMP activates PKA.",
        tags: ["cell signaling", "gpcr"],
        deck: "Cell Biology Final",
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
        due: now,
        createdAt: now - 4 * day,
      },
      {
        id: uid("card_"),
        front: "In oxidative phosphorylation, what is the final electron acceptor?",
        back: "Oxygen — it accepts electrons at Complex IV to form water.",
        tags: ["mitochondria"],
        deck: "Cell Biology Final",
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
        due: now,
        createdAt: now - 2 * day,
      },
    ],
    settings: {
      defaultSourceLocked: true,
      defaultPreserveLanguage: true,
      defaultModel: "Claude",
      theme: "dark",
    },
    modes: {
      sourceLocked: true,
      preserveLanguage: true,
      premedReasoning: true,
      highYield: false,
      finalsCram: false,
      academicIntegrity: true,
    },
    ai: {
      enabled: false,
      provider: "claude",
      claudeModel: "claude-opus-4-8",
      openaiModel: "gpt-4o",
      geminiModel: "gemini-1.5-flash",
      claudeKey: "",
      openaiKey: "",
      geminiKey: "",
      geminiAuthMode: "key",
      geminiClientId: "",
    },
  };
}

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
