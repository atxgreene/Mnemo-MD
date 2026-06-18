# Mnemo MD

**Source-locked study intelligence for medical school.**

### ▶ [Open the live app → atxgreene.github.io/Mnemo-MD](https://atxgreene.github.io/Mnemo-MD/)

[![Live demo](https://img.shields.io/badge/Live-Demo-5ad1c2?style=for-the-badge)](https://atxgreene.github.io/Mnemo-MD/)
[![Deploy to GitHub Pages](https://github.com/atxgreene/Mnemo-MD/actions/workflows/deploy.yml/badge.svg)](https://github.com/atxgreene/Mnemo-MD/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Works on desktop and mobile, installs as an app, and runs offline. No account, no
API key — your notes stay on your device.

### ⬇ Download Mnemo Med

The fastest way in is the **[live app](https://atxgreene.github.io/Mnemo-MD/)** — it
runs in any browser and installs to your home screen or desktop in one tap. Prefer a
native desktop app? Grab an installer from the
**[latest release](https://github.com/atxgreene/Mnemo-MD/releases/latest)**:

| Platform | Download | First launch |
| --- | --- | --- |
| **macOS** (Apple Silicon + Intel) | `Mnemo Med_universal.dmg` | Right-click the app → **Open** → **Open** (one time) |
| **Windows** | `Mnemo Med_x64-setup.exe` | On the SmartScreen prompt: **More info → Run anyway** |
| **Linux** | `.AppImage` (portable) or `.deb` | AppImage: `chmod +x` then run |

The desktop apps are unsigned, so your OS shows a one-time warning on first launch —
that's expected. Everything is local-first: your notes, cards, and any API keys never
leave your machine.

Mnemo MD is a local-first, source-locked study cockpit for medical students. It
transforms lecture notes, slides, graphs, and professor wording into review
sheets, Anki cards, practice questions, and cram plans — without inventing
unsupported answers.

It is the first productized layer of **Mnemosyne** — the memory/retrieval
architecture. Mnemosyne is the engine; Mnemo Med is the med-school study product
built on top of it.

> **Mnemo Med is an educational study tool.** Verify all outputs against your
> official course materials. Do not use it to cheat or violate academic policies.

---

## Why it exists

Medical students already lean on Claude/ChatGPT to parse dense note sets, build
review sheets, make Anki cards, write practice questions, analyze graphs, and
answer from lecture material — because good models hallucinate less and preserve
the professor's exact wording. Mnemo Med turns that workflow into a real,
repeatable study system:

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
  questions, lab material, study guides, or graph/image descriptions, **or
  import files**: PDFs (text extracted locally via pdf.js), images of
  notes/slides (OCR'd in-browser via tesseract.js), and `.txt`/`.md`/`.csv`.
  Each source has a type, lecture number, topic tags, importance, and a
  *lock-wording* toggle.
- **Mnemosyne Lite (semantic)** — a local retrieval layer that ranks evidence
  by **TF-IDF cosine similarity** (so conceptually-related notes surface even
  without exact word matches), layered with keyword/tag/topic/exact-phrase hits
  plus recency and importance weighting. Returns ranked, highlighted snippets
  with relevance scores — all offline, no model download.
- **Flashcards (SRS)** — a local spaced-repetition deck using an Anki-flavored
  SM-2 scheduler. Add cards manually or import an Anki CSV (paste the Anki
  Factory output straight in), then review what's due with Again/Hard/Good/Easy
  grading (Space to flip, 1–4 to grade). Deck stats track new/learning/mature/due.
  Export the deck as a real **`.apkg`** (imports natively into Anki with a note
  type + deck — no field mapping) or as CSV.
- **Course templates** — one-tap starter courses for Anatomy, Physiology,
  Biochem, Pharmacology, Micro, Immunology, Pathology, Genetics, and the three
  Histology, Neuroanatomy, Biostatistics, and USMLE Step 1 (loads topics + seeds
  the weakness tracker).
- **In-app Guide & printable outputs** — a built-in best-practices guide, plus
  Print / Save-as-PDF for any saved output.
- **Quiz Mode** — a timed, scored self-test auto-generated from your deck
  (multiple choice with distractors drawn from your other cards, or self-graded
  recall for small decks), with a missed-question review at the end.
- **Generation modes (global toggles)** — Source-Locked, Preserve Professor
  Language, Clinical Reasoning, High-Yield, Finals Cram, Academic Integrity.
- **Prompt Lab** — Review Sheet, Explain the Concept, Professor Wording
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
shell and runs offline. Install it for an app icon, its own window, and full
offline use on desktop or mobile — use the **Install app** button in the sidebar
(or in *Settings*), or your browser's Install / "Add to Home Screen" option.

### Desktop app (Tauri)

A native desktop build is configured under [`src-tauri/`](src-tauri/). It wraps
the same web build in a tiny native window — no separate codebase.

Prerequisites: [Rust](https://rustup.rs) + your OS's WebView deps (see the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/); on Linux,
`webkit2gtk` and `librsvg`). Then:

```bash
npm install
npm run tauri:dev      # run the desktop app against the dev server
npm run tauri:build    # produce native installers (.dmg / .exe / .AppImage / .deb)
```

The window icon ships as PNG. For polished Windows/macOS installer icons, run
`npm run tauri icon public/icon-512.png` once (generates `.ico`/`.icns` into
`src-tauri/icons/`) and add them to `bundle.icon` in `src-tauri/tauri.conf.json`.

---

## Usage guide

1. **Set up your course** in *Course Profile* (or start from the included
   *Cell & Molecular Medicine* sample).
2. **Add material** in *Source Library* — paste text or **import a PDF / image /
   file** (PDFs are text-extracted; images are OCR'd in-browser). Tag sources
   and lock wording where the professor's phrasing matters.
3. **Pick your generation modes** (Source-Locked and Preserve Language are on by
   default).
4. **Generate** in any workspace. Review the *Mnemosyne Lite* evidence first,
   then copy the prompt into your AI of choice (attach the real image for graph
   analysis).
5. **Build a deck**: generate cards in *Anki Factory*, paste the CSV into
   *Flashcards* to import them, then **review with spaced repetition** and
   **test yourself in *Quiz Mode***.
6. **Track weakness** and **build a cram plan** as the exam approaches.
7. **Save outputs** to the Vault and **back up** your data from *Settings*.

---

## Privacy

Mnemo MD is local-first. Your profile, notes, weak topics, and outputs are
stored only in your browser's local storage. There is no backend, no telemetry,
and no network request for your data. Backups are plain JSON files you control.

---

## Architecture (Mnemosyne vocabulary)

Core TypeScript types live in [`src/types.ts`](src/types.ts): `SourceMaterial`,
`EvidenceSnippet`, `RetrievalResult`, `StudyProfile`, `PromptMode`,
`ModeToggles`, `WeakTopic`, `Flashcard`, `OutputVaultItem`, and `MnemoSettings`.

Reusable utilities:

| Utility | Location |
| --- | --- |
| `saveToStorage` / `loadFromStorage` | `src/lib/storage.ts` |
| `retrieveRelevantSources` (Mnemosyne Lite, TF-IDF cosine) | `src/lib/retrieval.ts` |
| `extractTextFromFile` (PDF / OCR / text ingestion) | `src/lib/ingest.ts` |
| `reviewCard` / `dueCards` / `parseCardsCSV` (SM-2 SRS) | `src/lib/srs.ts` |
| `generatePrompt` | `src/lib/promptGenerator.ts` |
| `exportMarkdown` / `exportCSV` / `exportJSON` / `importJSON` | `src/lib/exporters.ts` |
| `calculateWeaknessPriority` | `src/lib/weakness.ts` |
| `calculateDaysUntilExam` | `src/lib/dates.ts` |

The API adapter layer (for future OpenAI / Claude / Gemini / local LLM /
Mnemosyne backends) is intentionally optional and disabled by default — the app
is fully useful by generating elite prompts you paste into any model.

---

## Limitations

- **PDF text extraction** reads embedded text. Scanned/image-only PDFs have no
  text layer — export the page as an image and import it to OCR instead.
- **OCR** downloads its engine + language data on first use, so the first image
  import needs a network connection (subsequent OCR is cached). PDF and text
  parsing are fully offline.
- **Image *analysis*** is still prompt-based (Path A): the app generates the
  vision prompt and you attach the image to a vision-capable model. A live
  in-app vision API is the next step (see below).
- Semantic retrieval is local TF-IDF cosine similarity, not learned embeddings
  — strong and offline, but a true vector/embedding backend is a later upgrade.
- Generated prompts and quizzes are study aids. Always verify against official
  materials.

---

## Roadmap

**v1**
- Local-first prompt cockpit · Mnemosyne Lite retrieval · review/Anki/practice
  prompts · weak-topic tracker · finals planner

**v2 (this release)**
- ✅ File upload parsing, in-browser PDF extraction, in-browser OCR
- ✅ Semantic retrieval (TF-IDF cosine similarity)
- ✅ Quiz mode + spaced-repetition scheduler (SM-2) with a local flashcard deck
- ✅ Course templates + printable/PDF outputs + in-app Guide
- ✅ Real `.apkg` Anki export (in-browser SQLite + zip)
- ✅ Optional AI adapter — opt-in "Run with AI" for Claude / OpenAI / Gemini
  (keys on-device, streaming), plus an experimental Gemini Google-OAuth (PKCE)
  path. Disabled by default; the copy/paste workflow still works without it.
- ✅ In-app image analysis — when an AI is connected, Image/Graph mode sends the
  uploaded figure to a vision-capable model and streams the analysis in-app
  (still prompt-only when no AI is connected).

**v3 (in progress)**
- ✅ Multi-course memory — keep many courses on one device, each with its own
  profile, sources, weak topics, flashcards, and outputs; switch from the
  sidebar. (Old single-course data migrates automatically.)
- ✅ Adaptive exams — a practice exam that weights questions toward your weak
  topics and adjusts difficulty to your performance (a local IRT/CAT loop over
  your flashcard deck), then feeds per-topic results back into the tracker.
- ✅ Desktop app packaging — Tauri scaffold (`src-tauri/`) builds native
  installers from the same web build (`npm run tauri:build`).
- ⏳ Mobile app store packaging (Tauri mobile / Capacitor)
- ⏳ Full Mnemosyne backend · multi-device sync · collaborative study groups
  (require a backend)

---

## Tech stack

Vite · React · TypeScript · Tailwind CSS · local storage · PWA · pdf.js (PDF
text) · tesseract.js (OCR). No required backend; heavy parsers are lazy-loaded
so the initial bundle stays small.

## License

[MIT](LICENSE)
