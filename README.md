# Mnemo-MD

**Mnemo Med** is a source-locked premed study engine that turns lecture notes,
graphs, and professor wording into review sheets, Anki cards, and practice
questions — without inventing unsupported answers.

## v1 — Single-File Study Cockpit

`index.html` is a complete, self-contained app. **No backend, no login, no API
key.** Just open it in any modern browser.

It works as a copy/paste command center: you input your notes, pick what you
want to make, and it generates an optimized prompt to paste into Claude or
ChatGPT.

### Features

| Feature | What it does |
| --- | --- |
| **Study Setup** | Course, exam name, professor, topics, exam date, target difficulty |
| **Notes Input** | Paste lecture notes, professor's exact wording, and slide/figure references |
| **Output Selector** | Review sheet, Anki cards, practice questions, graph/image analysis, verified answers |
| **Mode Toggles** | Source-Locked, Preserve Professor Language, Premed Reasoning, High-Yield Only, Finals Cram |
| **Prompt Generator** | Builds Claude- or ChatGPT-optimized prompts, copy or download |
| **Anki Export Builder** | Basic / Cloze / Tagged card styles with CSV-ready formatting instructions |
| **Practice Question Generator** | MCQ, short answer, application/clinical, graph-based; "explain why wrong answers are wrong" |
| **Weakness Tracker** | Mark each topic weak / medium / strong |
| **Finals Cram Planner** | Day-by-day plan to your exam date, front-loading weak topics |

Everything is auto-saved to your browser's local storage — your notes never
leave your device.

### Usage

1. Open `index.html` in a browser.
2. Fill in Study Setup and paste your notes.
3. Pick an output type and toggle the modes you want.
4. Copy the generated prompt into Claude or ChatGPT (attach the actual image
   for graph/figure analysis).

### Limitation

A single HTML file can't *read* images or notes on its own — that needs an AI
model. Mnemo Med v1 organizes your material and generates elite, source-locked
prompts. A future v2 would add file upload, OCR, image analysis, real Anki
export, quiz mode, and a memory layer behind an API/backend.
