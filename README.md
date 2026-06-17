# Mnemo MD

**Source-locked study intelligence for premed finals.**

Mnemo MD is a local-first, source-locked study cockpit for premed students. It
transforms notes, slides, graphs, and professor wording into review sheets,
Anki cards, practice questions, and finals cram plans — without inventing
unsupported answers.

It is the first productized layer of **Mnemosyne** — the memory/retrieval
architecture. Mnemosyne is the engine; Mnemo Med is the premed study product
built on top of it.

> **Mnemo Med is an educational study tool.** Verify all outputs against your
> official course materials. Do not use it to cheat or violate academic policies.

---

## Why it exists

Premed students already lean on Claude/ChatGPT to parse note sets, build review
sheets, make Anki cards, write practice questions, analyze graphs, and answer
from lecture material — because good models hallucinate less and preserve the
professor's exact wording. Mnemo Med turns that workflow into a real, repeatable
study system:

- **Source-locked** generation — every prompt forces the model to use *only*
  your provided notes and to flag anything unsupported.
- **Preserve professor language** — keep awkward-but-testable phrasing intact
  instead of letting the model "clean it up."
- **Mnemosyne Lite retrieval** — see the evidence behind a prompt *before* you
  generate it.
- **No backend, no API key, no account.** Everything is stored locally in your
  browser. It still works fully offline as an installable PWA.

---

## Features

- **Dashboard** — exam countdown, source/weak-topic counts, study confidence
  score, priority review order, and a recommended next action.
- **Course Profile** — course, professor, exam, date, topics, difficulty,
  preferred model, study hours, grading & wording notes.
- **Source Library** — paste notes, slides, professor hints, practice
  questions, lab material, study guides, or graph/image descriptions. Each
  source has a type, lecture number, topic tags, importance, and a
  *lock-wording* toggle.
- **Mnemosyne Lite** — a lightweight, local retrieval layer (keyword/tag/topic
  matching, exact-phrase, recency, and importance weighting) that returns
  ranked, highlighted evidence snippets with relevance scores.
- **Generation modes (global toggles)** — Source-Locked, Preserve Professor
  Language, Premed Reasoning, High-Yield, Finals Cram, Academic Integrity.
- **Prompt Lab** — Review Sheet, Explain Like I'm Premed, Professor Wording
  Parser, Weak Topic Drill, and Missed Question Autopsy.
- **Anki Factory** — Basic/Cloze/Definition/Mechanism/Pathway/Compare-contrast/
  Clinical/Image-occlusion cards exported as `Front,Back,Tags,Source,Difficulty`.
- **Practice Builder** — MCQ, short answer, select-all, application, graph,
  mechanism, pathway-ordering, "which is false," professor-style, and brutal
  finals mode — with answer keys, per-distractor rationale, evidence, and trap
  types.
- **Image / Graph mode** — local image preview + a vision-analysis prompt to
  paste into a vision-capable model (with a clean adapter seam for a future API).
- **Verified Answers** — answer practice questions strictly from your notes,
  with confidence, cited evidence, and an optional Outside Context Mode.
- **Weakness Tracker** — confidence (1–5), missed questions, notes, next action,
  computed priority, and recommended review order.
- **Cram Planner** — a day-by-day plan to your exam date that front-loads weak
  topics, plus a full cram-plan prompt.
- **Output Vault** — save generated prompts and pasted AI outputs; search, copy,
  export, delete.
- **Export / Import** — `.txt`, `.md`, `.csv`, and a full JSON backup you can
  re-import on any device.

---

## Screenshots

> _Screenshots placeholder — add captures of the Dashboard, Prompt Lab, and
> Mnemosyne Lite evidence panel here._

---

## Install & run

Requires Node.js 18+.

```bash
npm install
npm run dev      # start the local dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

The app is a Progressive Web App: after the first production load it caches the
shell and runs offline. You can "Install" it from the browser for an app-like
experience on desktop or mobile.

---

## Usage guide

1. **Set up your course** in *Course Profile* (or start from the included
   *Cell Biology Final* sample).
2. **Add material** in *Source Library* — paste notes/slides/professor wording,
   tag them, and lock wording where the professor's phrasing matters.
3. **Pick your generation modes** (Source-Locked and Preserve Language are on by
   default).
4. **Generate** in any workspace. Review the *Mnemosyne Lite* evidence first,
   then copy the prompt into your AI of choice (attach the real image for graph
   analysis).
5. **Track weakness** and **build a cram plan** as the exam approaches.
6. **Save outputs** to the Vault and **back up** your data from *Settings*.

---

## Privacy

Mnemo MD is local-first. Your profile, notes, weak topics, and outputs are
stored only in your browser's local storage. There is no backend, no telemetry,
and no network request for your data. Backups are plain JSON files you control.

---

## Architecture (Mnemosyne vocabulary)

Core TypeScript types live in [`src/types.ts`](src/types.ts): `SourceMaterial`,
`EvidenceSnippet`, `RetrievalResult`, `StudyProfile`, `PromptMode`,
`ModeToggles`, `WeakTopic`, `OutputVaultItem`, and `MnemoSettings`.

Reusable utilities:

| Utility | Location |
| --- | --- |
| `saveToStorage` / `loadFromStorage` | `src/lib/storage.ts` |
| `retrieveRelevantSources` (Mnemosyne Lite) | `src/lib/retrieval.ts` |
| `generatePrompt` | `src/lib/promptGenerator.ts` |
| `exportMarkdown` / `exportCSV` / `exportJSON` / `importJSON` | `src/lib/exporters.ts` |
| `calculateWeaknessPriority` | `src/lib/weakness.ts` |
| `calculateDaysUntilExam` | `src/lib/dates.ts` |

The API adapter layer (for future OpenAI / Claude / Gemini / local LLM /
Mnemosyne backends) is intentionally optional and disabled by default — the app
is fully useful by generating elite prompts you paste into any model.

---

## Limitations

- A local app cannot truly *analyze* an image or parse a PDF on its own — v1
  generates an excellent vision/analysis prompt instead. Attach the real image
  to a vision-capable model.
- Mnemosyne Lite is keyword/heuristic retrieval, not a true vector database
  (that arrives in v2).
- Generated prompts are study aids. Always verify against official materials.

---

## Roadmap

**v1 (this release)**
- Local-first prompt cockpit
- Mnemosyne Lite retrieval
- Review sheet / Anki / practice-question prompts
- Weak topic tracker
- Finals planner

**v2**
- File upload parsing, PDF extraction, OCR
- Real vector retrieval
- AI API integrations + in-app image analysis
- Downloadable Anki package, quiz mode, spaced-repetition scheduler

**v3**
- Full Mnemosyne backend
- Multi-course memory
- Collaborative study groups
- Adaptive exams
- Mobile app packaging

---

## Tech stack

Vite · React · TypeScript · Tailwind CSS · local storage · PWA. No required
backend.

## License

[MIT](LICENSE)
