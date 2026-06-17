import GeneratorPage from "../components/GeneratorPage";
import { Field } from "../ui";

const CARD_TYPES = [
  "Basic",
  "Cloze",
  "Definition",
  "Mechanism",
  "Pathway",
  "Compare/Contrast",
  "Clinical/Application",
  "Image Occlusion",
];

export default function AnkiFactory() {
  return (
    <GeneratorPage
      mode="anki-cards"
      icon="🃏"
      title="Anki Factory"
      subtitle="Generate atomic, CSV-ready flashcards (Front, Back, Tags, Source, Difficulty)."
      queryLabel="Focus topic (optional)"
      queryPlaceholder="e.g. the sodium-potassium pump"
      defaultOptions={{ ankiTypes: ["Basic", "Cloze", "Definition"], difficulty: "Standard exam level" }}
      controls={(o, set) => (
        <>
          <Field label="Card styles to include">
            <div className="flex flex-wrap gap-2">
              {CARD_TYPES.map((t) => {
                const on = (o.ankiTypes ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const cur = o.ankiTypes ?? [];
                      set({ ankiTypes: on ? cur.filter((x) => x !== t) : [...cur, t] });
                    }}
                    className={`badge ${on ? "border-teal-400/40 bg-teal-400/15 text-teal-200" : "border-white/10 bg-white/5 text-slate-400"}`}
                  >
                    {on ? "●" : "○"} {t}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Difficulty">
            <select className="select" value={o.difficulty ?? ""} onChange={(e) => set({ difficulty: e.target.value })}>
              <option>Foundational — define & recall</option>
              <option>Standard exam level</option>
              <option>Challenging — integration & application</option>
              <option>Board / USMLE-style reasoning</option>
            </select>
          </Field>
        </>
      )}
    />
  );
}
