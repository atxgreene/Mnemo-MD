import GeneratorPage from "../components/GeneratorPage";
import { Field, Toggle } from "../ui";

const Q_TYPES = [
  "multiple choice",
  "short answer",
  "select all that apply",
  "application",
  "graph interpretation",
  "mechanism",
  "pathway ordering",
  "which statement is false",
  "professor-style",
  "brutal finals mode",
];

export default function PracticeBuilder() {
  return (
    <GeneratorPage
      mode="practice-questions"
      icon="✍️"
      title="Practice Builder"
      subtitle="Generate exam-style questions with answer keys, evidence, and trap analysis."
      queryLabel="Topic (optional)"
      queryPlaceholder="e.g. cell signaling"
      defaultOptions={{
        questionCount: 10,
        difficulty: "Standard exam level",
        questionTypes: ["multiple choice", "application"],
        includeAnswerKey: true,
        includeExplanations: true,
        professorStyle: false,
      }}
      controls={(o, set) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of questions">
              <input
                type="number"
                min={1}
                max={50}
                className="input"
                value={o.questionCount ?? 10}
                onChange={(e) => set({ questionCount: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
            <Field label="Difficulty">
              <select className="select" value={o.difficulty ?? ""} onChange={(e) => set({ difficulty: e.target.value })}>
                <option>Foundational — define & recall</option>
                <option>Standard exam level</option>
                <option>Challenging — integration & application</option>
                <option>Board / USMLE-style reasoning</option>
              </select>
            </Field>
          </div>

          <Field label="Question types">
            <div className="flex flex-wrap gap-2">
              {Q_TYPES.map((t) => {
                const on = (o.questionTypes ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const cur = o.questionTypes ?? [];
                      set({ questionTypes: on ? cur.filter((x) => x !== t) : [...cur, t] });
                    }}
                    className={`badge ${on ? "border-teal-400/40 bg-teal-400/15 text-teal-200" : "border-white/10 bg-white/5 text-slate-400"}`}
                  >
                    {on ? "●" : "○"} {t}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle checked={o.includeAnswerKey !== false} onChange={(v) => set({ includeAnswerKey: v })} label="Answer key" />
            <Toggle checked={o.includeExplanations !== false} onChange={(v) => set({ includeExplanations: v })} label="Explanations" />
            <Toggle checked={!!o.professorStyle} onChange={(v) => set({ professorStyle: v })} label="Professor-style wording" />
          </div>
        </>
      )}
    />
  );
}
