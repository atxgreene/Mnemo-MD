import { useMemo, useState } from "react";
import { useStore } from "../store";
import { retrieveRelevantSources } from "../lib/retrieval";
import { generatePrompt } from "../lib/promptGenerator";
import { aiReady, providerLabel, type ImageInput } from "../lib/ai/run";
import { Panel, SectionTitle, Field } from "../ui";
import ModeBar from "../components/ModeBar";
import StatusBadges from "../components/StatusBadges";
import SourceSelect from "../components/SourceSelect";
import EvidencePanel from "../components/EvidencePanel";
import PromptWorkspace from "../components/PromptWorkspace";
import Disclaimer from "../components/Disclaimer";

/**
 * Graph / Image mode.
 * - With an AI connection: the uploaded image is sent to a vision-capable model
 *   and analyzed in-app (streamed into the workspace).
 * - Without one: generate the vision prompt and attach the image to your model.
 */
export default function ImageMode() {
  const { state } = useStore();
  const [selected, setSelected] = useState<string[]>(state.sources.map((s) => s.id));
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<ImageInput | null>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      // data:image/png;base64,XXXX → { mediaType, base64 }
      const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
      if (match) setImage({ mediaType: match[1], base64: match[2] });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    setImage(null);
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

  const connected = aiReady(state.ai);

  return (
    <div className="space-y-5">
      <SectionTitle
        icon="📈"
        title="Image / Graph Analysis"
        subtitle={
          connected
            ? `Upload a figure and analyze it in-app with ${providerLabel(state.ai.provider)}.`
            : "Describe a figure, generate a vision prompt, and attach the image to your model."
        }
        right={<StatusBadges />}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel>
            <Field label="Upload image">
              <input type="file" accept="image/*" className="input" onChange={(e) => onFile(e.target.files?.[0])} />
            </Field>
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="preview" className="max-h-64 w-full rounded-xl border border-white/10 object-contain" />
                <button className="mt-2 text-xs text-slate-500 hover:text-rose-300" onClick={clearImage}>✕ Remove image</button>
              </div>
            )}
            <div className="mt-4">
              <Field label="Describe the figure (optional when analyzing in-app)" hint="Axes, labels, curves, what it depicts. Also drives retrieval below.">
                <textarea
                  className="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Oxygen–hemoglobin dissociation curve; x-axis pO2, y-axis % saturation; sigmoid with a right shift…"
                />
              </Field>
            </div>
            {connected ? (
              image ? (
                <div className="mt-2 rounded-lg border border-teal-400/20 bg-teal-400/[0.06] px-3 py-2 text-xs text-teal-100/90">
                  ✓ Image ready. Use <b>Analyze with {providerLabel(state.ai.provider)}</b> below to read it against your notes.
                </div>
              ) : (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                  Upload an image to analyze it in-app, or just describe it for a text-only answer.
                </div>
              )
            ) : (
              <div className="mt-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-100/80">
                ⓘ No AI connected. Generate the prompt below and attach the actual image to a vision-capable model — or
                connect one in Settings to analyze it here.
              </div>
            )}
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

      <PromptWorkspace mode="graph-image" prompt={prompt} sourceIds={selected} image={image ?? undefined} />
      <Disclaimer />
    </div>
  );
}
