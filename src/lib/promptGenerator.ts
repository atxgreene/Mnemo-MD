import {
  ModeToggles,
  PromptMode,
  RetrievalResult,
  SOURCE_TYPE_LABELS,
  SourceMaterial,
  StudyProfile,
} from "../types";

/**
 * Prompt generation — the heart of Mnemo Med.
 *
 * Every generated prompt is assembled from:
 *   role → operating rules (from global toggles) → context → evidence
 *   (selected sources + Mnemosyne Lite snippets) → task & output format →
 *   hallucination guardrails.
 *
 * The whole point: ground outputs in the student's own material and refuse
 * to invent unsupported facts.
 */

export interface PromptOptions {
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  questionTypes?: string[];
  includeAnswerKey?: boolean;
  includeExplanations?: boolean;
  professorStyle?: boolean;
  ankiTypes?: string[];
  userQuestions?: string;
  imageDescription?: string;
  outsideContext?: boolean;
  studyHoursPerDay?: number;
  weakTopics?: string[];
}

export interface PromptContext {
  modes: ModeToggles;
  profile: StudyProfile;
  sources: SourceMaterial[];
  evidence: RetrievalResult[];
  options?: PromptOptions;
}

const SOURCE_LOCK_LINE =
  "Use only the provided source material. If the answer is not supported, say 'Not supported by provided notes.' Do not invent facts.";

const PRESERVE_LANG_LINE =
  "Do not rewrite, polish, or correct the professor's wording unless explicitly asked. Preserve terminology, phrasing, grammar, and slide language. If language is awkward, explain underneath instead of replacing it.";

function operatingRules(ctx: PromptContext): string[] {
  const m = ctx.modes;
  const lines: string[] = ["## OPERATING RULES"];

  if (m.sourceLocked) {
    lines.push(`- SOURCE-LOCKED: ${SOURCE_LOCK_LINE}`);
    lines.push("- Cite the source title (and lecture number if present) for every claim.");
  } else {
    lines.push("- Prefer the provided source material. You may add standard medical knowledge, but clearly label it '(outside notes)'.");
  }

  if (m.preserveLanguage) lines.push(`- PRESERVE PROFESSOR LANGUAGE: ${PRESERVE_LANG_LINE}`);
  if (m.premedReasoning)
    lines.push("- CLINICAL REASONING: Provide applied anatomical, physiological, biochemical, pharmacological, and clinical reasoning where appropriate (mechanism → effect → clinical significance).");
  if (m.highYield)
    lines.push("- HIGH-YIELD: Prioritize exam-relevant concepts, likely traps, definitions, mechanisms, pathways, and professor-emphasized details.");
  if (m.finalsCram) lines.push("- FINALS CRAM: Compress into high-yield, testable, prioritized study material.");
  if (m.academicIntegrity)
    lines.push("- ACADEMIC INTEGRITY: Help the student study and understand. Do not help cheat on a live exam or submit AI-written work dishonestly.");

  lines.push("- Mark any uncertain item with ⚠️ and explain the uncertainty.");
  lines.push("- Never present output as guaranteed correct; remind the student to verify against official course materials.");
  return lines;
}

function contextBlock(ctx: PromptContext): string[] {
  const p = ctx.profile;
  const o = ctx.options ?? {};
  const lines: string[] = ["## CONTEXT"];
  if (p.courseName) lines.push(`- Course: ${p.courseName}`);
  if (p.professor) lines.push(`- Professor: ${p.professor}`);
  if (p.examName) lines.push(`- Exam: ${p.examName}`);
  if (p.examDate) lines.push(`- Exam date: ${p.examDate}`);
  const difficulty = o.difficulty || p.difficulty;
  if (difficulty) lines.push(`- Target difficulty: ${difficulty}`);
  if (o.topic) lines.push(`- Focus topic: ${o.topic}`);
  if (p.topics.length) lines.push(`- Topics in scope: ${p.topics.join(", ")}`);
  if (o.weakTopics && o.weakTopics.length) lines.push(`- Student's weak topics (prioritize): ${o.weakTopics.join(", ")}`);
  if (p.professorWordingNotes) lines.push(`- Professor wording notes: ${p.professorWordingNotes}`);
  if (p.gradingNotes) lines.push(`- Grading style notes: ${p.gradingNotes}`);
  return lines.length > 1 ? lines : [];
}

function evidenceBlock(ctx: PromptContext): string[] {
  const lines: string[] = [];

  if (ctx.sources.length) {
    lines.push("## SOURCE MATERIAL");
    ctx.sources.forEach((s, i) => {
      const lock = s.lockWording ? " [PRESERVE WORDING VERBATIM]" : "";
      const lecture = s.lectureNumber ? `, Lecture ${s.lectureNumber}` : "";
      lines.push(`### Source ${i + 1}: ${s.title} (${SOURCE_TYPE_LABELS[s.type]}${lecture})${lock}`);
      if (s.topics.length) lines.push(`Topics: ${s.topics.join(", ")}`);
      lines.push(s.content.trim());
      lines.push("");
    });
  }

  if (ctx.evidence.length) {
    lines.push("## RETRIEVED EVIDENCE (Mnemosyne Lite)");
    lines.push("These snippets were ranked as most relevant. Anchor your answer to them.");
    ctx.evidence.forEach((e) => {
      lines.push(`- [${e.sourceTitle} · ${SOURCE_TYPE_LABELS[e.sourceType]} · relevance ${e.score}] "${e.snippet}"`);
    });
    lines.push("");
  }

  if (!ctx.sources.length && !ctx.evidence.length) {
    lines.push("## SOURCE MATERIAL");
    lines.push("[No sources selected in Mnemo Med. Paste your notes here before sending.]");
    lines.push("");
  }

  return lines;
}

function guardrailFooter(ctx: PromptContext): string[] {
  const lines = ["## GUARDRAILS"];
  if (ctx.modes.sourceLocked)
    lines.push("- Anything not supported by the source material above must be labeled 'Not supported by provided notes.'");
  lines.push("- Separate source-based answers from any outside context.");
  lines.push("- End with a one-line reminder to verify against official course materials.");
  return lines;
}

function difficultyOf(ctx: PromptContext): string {
  return ctx.options?.difficulty || ctx.profile.difficulty || "standard exam level";
}

/** Mode-specific task + output-format block. */
function taskBlock(mode: PromptMode, ctx: PromptContext): string[] {
  const o = ctx.options ?? {};
  switch (mode) {
    case "review-sheet":
      return [
        "## TASK — High-Yield Review Sheet",
        "Produce a review sheet grouped by topic. For EACH concept include:",
        "- Concept",
        "- Original source wording (verbatim when preserve-language is on)",
        "- Clean explanation",
        "- Why it matters",
        "- Mechanism / pathway",
        "- Likely exam angle",
        "- Common trap",
        "- Mini example",
        "- Source evidence (which source it came from)",
        "",
        "Also include two sections at the end:",
        "- '## Must Memorize' — the non-negotiable facts.",
        "- '## Understand Deeply' — the concepts requiring reasoning.",
        "Output as clean Markdown beginning with '# High-Yield Review Sheet'.",
      ];

    case "anki-cards": {
      const types = (o.ankiTypes && o.ankiTypes.length ? o.ankiTypes : ["Basic", "Cloze", "Definition"]).join(", ");
      return [
        "## TASK — Anki Card Generation",
        `Card styles to use: ${types}.`,
        "Output the cards as a CSV code block with this exact header row:",
        "Front,Back,Tags,Source,Difficulty",
        "Rules:",
        "- One atomic fact per card (avoid broad cards).",
        "- Preserve source terminology.",
        "- Tags = topic name(s), use :: for subtopics, no spaces inside a tag.",
        "- Source = the source title the card came from.",
        "- Difficulty = easy | medium | hard.",
        "- Use cloze syntax {{c1::...}} for sequences, equations, mechanisms, pathways, and definitions.",
        "- Add 'trap cards' for common wrong answers (Tag them with ::trap).",
        "- Escape any commas inside a field by wrapping that field in double quotes.",
      ];
    }

    case "practice-questions":
    case "practice-exam": {
      const count = o.questionCount ?? (mode === "practice-exam" ? 25 : 10);
      const qtypes = (o.questionTypes && o.questionTypes.length
        ? o.questionTypes
        : ["multiple choice", "application"]
      ).join(", ");
      const lines = [
        `## TASK — ${mode === "practice-exam" ? "Practice Exam" : "Practice Questions"}`,
        `Write ${count} questions at ${difficultyOf(ctx)} difficulty.`,
        `Question types to include: ${qtypes}.`,
      ];
      if (o.professorStyle) lines.push("- Mimic this professor's question style and wording where known.");
      lines.push(
        "- For multiple choice: 5 options (A–E), exactly one best answer.",
        "- Number every question."
      );
      if (o.includeAnswerKey === false) {
        lines.push("- Do NOT include an answer key (questions only).");
      } else {
        lines.push("- Put all answers in a separate '## Answer Key' at the end (not inline).");
        lines.push("For each answer provide:");
        lines.push("  - Correct answer");
        if (o.includeExplanations !== false) {
          lines.push("  - Explanation");
          lines.push("  - Why each wrong answer is wrong");
        }
        lines.push("  - Exact evidence from the notes (quote a short phrase)");
        lines.push("  - Tested concept");
        lines.push("  - Difficulty rating");
        lines.push("  - Trap type (what makes the distractors tempting)");
      }
      return lines;
    }

    case "graph-image":
      return [
        "## TASK — Graph / Image Analysis",
        "An image is attached (or described below). Using the source material, report:",
        "- What the image shows",
        "- Key labels / structures",
        "- Axes and variables (for graphs)",
        "- The trend or relationship",
        "- The underlying mechanism (grounded in the notes)",
        "- Likely tested concepts",
        "- Possible exam questions (with answers)",
        "- Common misinterpretations",
        "- 3–5 Anki cards for this figure (Front,Back format)",
        "- The source-locked connection to the notes",
        o.imageDescription ? `\nImage description provided by student:\n${o.imageDescription}` : "",
        "\n[Attach the actual image alongside this prompt so a vision-capable model can see it.]",
      ];

    case "verified-answer":
      return [
        "## TASK — Verified Answer Check",
        o.outsideContext
          ? "Outside Context Mode is ENABLED: you may use outside knowledge, but clearly separate it from note-based answers and label it '(outside notes)'."
          : "Answer using ONLY the provided source material. Do not use outside knowledge.",
        "For every question provide:",
        "- Answer",
        "- Confidence level (high / medium / low)",
        "- Evidence (cite the exact source section / quote)",
        "- Explanation",
        "- Unsupported gaps (what the notes don't cover)",
        "- Why alternative answers are wrong",
        "- Recommended note section to review",
        "If the notes do not support an answer, respond exactly: 'Not supported by provided notes.'",
        "",
        "QUESTIONS:",
        o.userQuestions?.trim() || "[Paste the practice questions to verify here before sending.]",
      ];

    case "weak-drill":
      return [
        "## TASK — Weak Topic Drill",
        `Build an intensive drill for the student's weakest topic(s)${o.topic ? `: ${o.topic}` : ""}.`,
        "Include:",
        "- A 5-line refresher of the core mechanism (from the notes)",
        "- 8 rapid-fire recall questions (answers in a separate key)",
        "- 3 application / clinical-style questions with full explanations",
        "- The 3 most common traps for this topic and how to avoid them",
        "- A 1-paragraph 'teach it back' summary the student should be able to reproduce",
      ];

    case "cram-plan": {
      const hours = o.studyHoursPerDay ?? ctx.profile.studyHoursPerDay ?? 3;
      return [
        "## TASK — Finals Cram Plan",
        `Build a day-by-day study plan from today until the exam date, assuming ~${hours} study hours/day.`,
        "Front-load the student's weak topics. For each day include:",
        "- Topic priority order (weak topics first)",
        "- Review blocks (what to read / make review sheets for)",
        "- Practice question blocks (how many, what type)",
        "- Anki blocks (new vs. review cards)",
        "- A graph/image review session where relevant",
        "- A missed-question review block",
        "Reserve the final day for full review + re-testing weak topics. Output as Markdown with one section per day.",
      ];
    }

    case "explain-premed":
      return [
        "## TASK — Explain the Concept",
        `Explain ${o.topic ? `'${o.topic}'` : "the selected concept"} clearly for a medical student.`,
        "- Start with a plain-language intuition, then build to the precise mechanism.",
        "- Connect it to chemistry / biology / physiology fundamentals.",
        "- Use one concrete example and one clinical tie-in.",
        "- End with 'How this is usually tested' and 2 self-check questions.",
      ];

    case "professor-wording":
      return [
        "## TASK — Professor Wording Parser",
        "Parse the professor's exact wording from the sources. For each key statement:",
        "- Quote the professor's exact phrasing (do NOT rewrite it).",
        "- Translate what it means in plain terms underneath.",
        "- Flag any ambiguous or awkward phrasing and explain the likely intent (without replacing the original).",
        "- Note the specific term/definition the professor seems to want reproduced on the exam.",
      ];

    case "missed-autopsy":
      return [
        "## TASK — Missed Question Autopsy",
        "The student got the questions below wrong. For each one:",
        "- Restate the question and the student's likely misconception.",
        "- Give the correct answer with note-based evidence.",
        "- Diagnose the root concept gap.",
        "- Provide the exact section of notes to re-study.",
        "- Write 2 follow-up questions to confirm the gap is closed.",
        "",
        "MISSED QUESTIONS:",
        o.userQuestions?.trim() || "[Paste the missed questions (and your wrong answers) here before sending.]",
      ];
  }
}

export function generatePrompt(mode: PromptMode, ctx: PromptContext): string {
  const blocks: string[][] = [
    [
      `You are Mnemo Med, a meticulous medical-school study assistant built on the Mnemosyne retrieval system. Target model: ${ctx.profile.preferredModel}.`,
      "Follow every rule below exactly.",
    ],
    operatingRules(ctx),
    contextBlock(ctx),
    evidenceBlock(ctx),
    taskBlock(mode, ctx),
    guardrailFooter(ctx),
  ];

  return blocks
    .filter((b) => b.length)
    .map((b) => b.filter((l) => l !== undefined).join("\n"))
    .join("\n\n")
    .trim();
}
