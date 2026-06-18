import { useStore } from "../store";
import { Panel, SectionTitle } from "../ui";
import Disclaimer from "../components/Disclaimer";

/**
 * In-app "how to use" guide + best practices, written for premed/med students.
 * Keeps everything scannable: the study loop, do/don't tips, and a tool cheat sheet.
 */
export default function Guide() {
  const { setPage } = useStore();

  return (
    <div className="space-y-5">
      <SectionTitle
        icon="📖"
        title="How to Use Mnemo Med"
        subtitle="A 60-second guide to studying smarter — and safely — for your next exam."
      />

      <Panel>
        <p className="text-slate-300">
          Mnemo Med turns <b>your own</b> notes, slides, and professor wording into verified study material.
          It's <b>source-locked</b>: it won't invent facts your class didn't teach. Use it to build review sheets,
          flashcards, and practice exams — then <b>always check the output against your official course materials</b>.
        </p>
      </Panel>

      {/* The study loop */}
      <Panel>
        <SectionTitle icon="🔄" title="The Study Loop" subtitle="Repeat this cycle as the exam approaches." />
        <div className="space-y-3">
          <Step n={1} title="Set up your course" go={() => setPage("profile")} goLabel="Course Profile"
            body="Enter your class, professor, exam date, and topics. This feeds context into everything and powers the cram plan." />
          <Step n={2} title="Add your material" go={() => setPage("sources")} goLabel="Source Library"
            body="Paste notes/slides, or import a PDF or a photo of your notes (text is extracted/OCR'd on your device). Tag each source by topic and lock the wording when the professor's exact phrasing matters." />
          <Step n={3} title="Generate study material" go={() => setPage("prompt-lab")} goLabel="Prompt Lab"
            body="Pick what you want — review sheet, Anki cards, practice questions, graph analysis. Review the retrieved evidence, copy the prompt into Claude/ChatGPT, and paste the result back into the Output Vault." />
          <Step n={4} title="Drill with flashcards & quizzes" go={() => setPage("flashcards")} goLabel="Flashcards"
            body="Paste your generated Anki cards into Flashcards to build a spaced-repetition deck, then review what's due. Test yourself in Quiz Mode and review what you miss." />
          <Step n={5} title="Track weakness & cram smart" go={() => setPage("cram")} goLabel="Cram Planner"
            body="Mark topics weak/medium/strong. The cram planner front-loads your weak areas into a day-by-day plan to the exam." />
        </div>
      </Panel>

      {/* Best practices */}
      <Panel>
        <SectionTitle icon="⭐" title="Best Practices" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Tip good title="Keep Source-Locked ON">
            It forces answers to come from your notes and flags anything unsupported as
            "Not supported by provided notes." This is what keeps it honest.
          </Tip>
          <Tip good title="Preserve professor language">
            When your professor wants exact definitions, turn on Preserve Language and lock wording on that source.
            Tested phrasing stays intact instead of getting "cleaned up."
          </Tip>
          <Tip good title="Make cards atomic">
            One fact per flashcard. Short Q → short A recalls better than a paragraph. Cloze deletions are great for
            sequences, pathways, and equations.
          </Tip>
          <Tip good title="Review a little, daily">
            Spaced repetition beats cramming. Do your due cards each day; the algorithm brings back what you're about to forget.
          </Tip>
          <Tip good title="Study weak topics first">
            Mark confidence honestly. The dashboard and cram plan put your weakest, most-missed topics at the front.
          </Tip>
          <Tip title="Always verify" warn>
            AI can still be wrong. Cross-check key facts, numbers, and mechanisms against your slides and textbook before
            you trust them on an exam.
          </Tip>
        </div>
      </Panel>

      {/* Tool cheat sheet */}
      <Panel>
        <SectionTitle icon="🧰" title="Tool Cheat Sheet" />
        <div className="space-y-2 text-sm">
          <Cheat icon="🧪" name="Prompt Lab" go={() => setPage("prompt-lab")}
            desc="Review sheets, Explain-Like-I'm-Premed, professor-wording parser, weak-topic drills, missed-question autopsy." />
          <Cheat icon="🃏" name="Anki Factory" go={() => setPage("anki")}
            desc="Generate CSV-ready cards (Front,Back,Tags,Source,Difficulty). Paste the result into Flashcards to study them here." />
          <Cheat icon="✍️" name="Practice Builder" go={() => setPage("practice")}
            desc="MCQ, application, 'which is false,' and more — with answer keys, evidence, and trap analysis." />
          <Cheat icon="📈" name="Image / Graph" go={() => setPage("image")}
            desc="Describe a figure (or attach it to a vision model) to get a labeled analysis tied to your notes." />
          <Cheat icon="✅" name="Verified Answers" go={() => setPage("verified")}
            desc="Paste practice questions to be answered strictly from your notes, with cited evidence." />
          <Cheat icon="🗂️" name="Flashcards (SRS)" go={() => setPage("flashcards")}
            desc="Spaced-repetition deck. Space = flip, keys 1–4 = grade. Import Anki CSV or add cards by hand." />
          <Cheat icon="🗄️" name="Output Vault" go={() => setPage("vault")}
            desc="Save generated prompts and paste back AI outputs. Search, copy, and export anytime." />
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon="🔒" title="Privacy & Integrity" />
        <ul className="ml-5 list-disc space-y-1.5 text-sm text-slate-300">
          <li>Everything stays on your device — no account, no servers. Back up anytime from <button className="text-teal-300 hover:underline" onClick={() => setPage("settings")}>Settings</button>.</li>
          <li>Install it as an app (sidebar → "Install app") to use it offline.</li>
          <li>Mnemo Med is a study aid. Don't use it to cheat on live exams or submit AI-written work.</li>
        </ul>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => setPage("profile")}>Start: set up my course →</button>
        <button className="btn btn-ghost" onClick={() => setPage("dashboard")}>Back to dashboard</button>
      </div>

      <Disclaimer />
    </div>
  );
}

function Step({ n, title, body, go, goLabel }: { n: number; title: string; body: string; go: () => void; goLabel: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 text-sm font-bold text-slate-900">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={go}>{goLabel} →</button>
        </div>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
      </div>
    </div>
  );
}

function Tip({ title, children, good, warn }: { title: string; children: React.ReactNode; good?: boolean; warn?: boolean }) {
  const icon = warn ? "⚠️" : good ? "✓" : "•";
  const ring = warn ? "border-amber-400/30" : "border-teal-400/20";
  return (
    <div className={`rounded-xl border ${ring} bg-white/[0.02] p-3`}>
      <div className="flex items-center gap-2 font-medium">
        <span className={warn ? "text-amber-300" : "text-teal-300"}>{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-sm text-slate-400">{children}</p>
    </div>
  );
}

function Cheat({ icon, name, desc, go }: { icon: string; name: string; desc: string; go: () => void }) {
  return (
    <button onClick={go} className="flex w-full items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left hover:border-white/20">
      <span className="text-lg">{icon}</span>
      <span className="min-w-0">
        <span className="font-medium">{name}</span>
        <span className="block text-xs text-slate-400">{desc}</span>
      </span>
    </button>
  );
}
