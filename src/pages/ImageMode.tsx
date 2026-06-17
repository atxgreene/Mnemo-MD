import { useMemo, useState } from "react";
import { useStore } from "../store";
import { retrieveRelevantSources } from "../lib/retrieval";
import { generatePrompt } from "../lib/promptGenerator";
import { Panel, SectionTitle, Field } from "../ui";
import ModeBar from "../components/ModeBar";
import StatusBadges from "../components/StatusBadges";
import SourceSelect from "../components/SourceSelect";
import EvidencePanel from "../components/EvidencePanel";
import PromptWorkspace from "../components/PromptWorkspace";
import Disclaimer from "../components/Disclaimer";

/**
 * Graph / Image mode.
 * Path A (shipped): describe/preview the image locally and generate a
 * vision-analysis prompt to paste into a vision-capable model.
 * Path B (future): the apiAdapter seam below is where a real vision API plugs in.
 */
export default function ImageMode() {
  const { state } = useStore();
  const [selected, setSelected] = useState<string[]>(state.sources.map((s) => s.id));
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const selectedSources = useMemo(() => state.sources.filter((s) => selected.includes(s.id)), [state.sources, selected]);
  const evidence = useMemo(
    () => retrieveRelevantSources(description || state.profile.topics.join(" "), state.sources),
    [description, state.sources, state.profile.topics]
  );

  const prompt = useMemo(
    () =>
      generatePrompt("graph-image", {
        modes: state.modes,
        profile: state.profile,
        sources: selectedSources,
        evidence,
        options: { imageDescription: description, topic: description },
      }),
    [state.modes, state.profile, selectedSources, evidence, description]
  );

  return (
    <div className="space-y-5">
      <SectionTitle
        icon="📈"
        title="Image / Graph Analysis"
        subtitle="Describe a figure, generate a vision prompt, and attach the image to your model."
        right={<StatusBadges />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel>
            <Field label="Upload image (preview only — stays on your device)">
              <input type="file" accept="image/*" className="input" onChange={(e) => onFile(e.target.files?.[0])} />
            </Field>
            {preview && (
              <img src={preview} alt="preview" className="mt-3 max-h-64 w-full rounded-xl border border-white/10 object-contain" />
            )}
            <div className="mt-4">
              <Field label="Describe the figure" hint="Axes, labels, curves, what it depicts. This grounds the analysis and retrieval.">
                <textarea
                  className="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Oxygen–hemoglobin dissociation curve; x-axis pO2, y-axis % saturation; sigmoid shape with a right shift…"
                />
              </Field>
            </div>
            <div className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-100/80">
              ⓘ A local app can't analyze an image alone. Generate the prompt below and attach the actual image to a
              vision-capable model (Claude / ChatGPT / Gemini). A future API adapter will analyze it in-app.
            </div>
          </Panel>

          <Panel>
            <SectionTitle icon="📚" title="Sources" subtitle="Connect the figure to your notes." />
            <SourceSelect selected={selected} onChange={setSelected} />
          </Panel>

          <ModeBar />
        </div>

        <Panel>
          <SectionTitle icon="🔎" title="Mnemosyne Lite — Retrieved Evidence" />
          <EvidencePanel results={evidence} />
        </Panel>
      </div>

      <PromptWorkspace mode="graph-image" prompt={prompt} sourceIds={selected} />
      <Disclaimer />
    </div>
  );
}
