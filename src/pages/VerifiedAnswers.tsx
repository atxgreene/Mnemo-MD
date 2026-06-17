import GeneratorPage from "../components/GeneratorPage";
import { Toggle } from "../ui";

export default function VerifiedAnswers() {
  return (
    <GeneratorPage
      mode="verified-answer"
      icon="✅"
      title="Verified Answers"
      subtitle="Answer practice questions using ONLY your notes. Unsupported answers must be flagged."
      queryLabel="Questions to verify"
      queryPlaceholder="Paste the practice questions you want answered strictly from your notes…"
      queryAs="userQuestions"
      multiline
      defaultOptions={{ outsideContext: false }}
      controls={(o, set) => (
        <Toggle
          checked={!!o.outsideContext}
          onChange={(v) => set({ outsideContext: v })}
          label="Outside Context Mode"
          description="Allow outside knowledge — clearly separated and labeled. Off = notes only."
        />
      )}
    />
  );
}
