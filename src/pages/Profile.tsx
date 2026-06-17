import { useStore } from "../store";
import type { ModelTarget } from "../types";
import { Panel, SectionTitle, Field, parseList } from "../ui";

const MODELS: ModelTarget[] = ["Claude", "ChatGPT", "Gemini", "Local LLM"];
const DIFFICULTIES = [
  "Foundational — define & recall",
  "Standard exam level",
  "Challenging — integration & application",
  "Board / USMLE-style reasoning",
];

export default function Profile() {
  const { state, setProfile } = useStore();
  const p = state.profile;

  return (
    <div className="space-y-5">
      <SectionTitle icon="🎓" title="Course Profile" subtitle="Saved locally. Powers context in every prompt." />

      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course name">
            <input className="input" value={p.courseName} onChange={(e) => setProfile({ courseName: e.target.value })} placeholder="e.g. Cell Biology Final" />
          </Field>
          <Field label="Professor">
            <input className="input" value={p.professor} onChange={(e) => setProfile({ professor: e.target.value })} placeholder="e.g. Dr. Example" />
          </Field>
          <Field label="Exam name">
            <input className="input" value={p.examName} onChange={(e) => setProfile({ examName: e.target.value })} placeholder="e.g. Final Exam" />
          </Field>
          <Field label="Exam date">
            <input type="date" className="input" value={p.examDate} onChange={(e) => setProfile({ examDate: e.target.value })} />
          </Field>
          <Field label="Difficulty level">
            <select className="select" value={p.difficulty} onChange={(e) => setProfile({ difficulty: e.target.value })}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Preferred AI model">
            <select className="select" value={p.preferredModel} onChange={(e) => setProfile({ preferredModel: e.target.value as ModelTarget })}>
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Available study hours / day">
            <input type="number" min={0.5} step={0.5} className="input" value={p.studyHoursPerDay} onChange={(e) => setProfile({ studyHoursPerDay: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Study goal">
            <input className="input" value={p.studyGoal} onChange={(e) => setProfile({ studyGoal: e.target.value })} placeholder="e.g. Score 90%+" />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Topics covered" hint="Comma-separated. These flow into retrieval, the weakness tracker, and the cram plan.">
            <textarea className="textarea" value={p.topics.join(", ")} onChange={(e) => setProfile({ topics: parseList(e.target.value) })} placeholder="membrane transport, cell signaling, mitochondria, …" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Grading style notes" hint="What the professor rewards / penalizes.">
            <textarea className="textarea" value={p.gradingNotes} onChange={(e) => setProfile({ gradingNotes: e.target.value })} placeholder="e.g. Heavy on mechanisms and 'which statement is false'." />
          </Field>
          <Field label="Professor wording notes" hint="Phrasing the professor wants reproduced verbatim.">
            <textarea className="textarea" value={p.professorWordingNotes} onChange={(e) => setProfile({ professorWordingNotes: e.target.value })} placeholder="e.g. Exact textbook definitions for transport." />
          </Field>
        </div>

        <p className="mt-4 text-xs text-slate-500">✓ Saved automatically as you type.</p>
      </Panel>
    </div>
  );
}
