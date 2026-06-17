import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import type { PromptMode } from "../types";
import { retrieveRelevantSources } from "../lib/retrieval";
import { generatePrompt, PromptOptions } from "../lib/promptGenerator";
import { Panel, SectionTitle, Field } from "../ui";
import ModeBar from "./ModeBar";
import StatusBadges from "./StatusBadges";
import SourceSelect from "./SourceSelect";
import EvidencePanel from "./EvidencePanel";
import PromptWorkspace from "./PromptWorkspace";
import Disclaimer from "./Disclaimer";

/**
 * Shared generator layout: source selection + Mnemosyne Lite retrieval +
 * page-specific controls + live prompt + workspace. Most generator pages are
 * thin wrappers around this.
 */
export default function GeneratorPage({
  mode,
  icon,
  title,
  subtitle,
  queryLabel,
  queryPlaceholder,
  queryAs = "topic",
  multiline = false,
  defaultOptions = {},
  controls,
  modeSelector,
}: {
  mode: PromptMode;
  icon: string;
  title: string;
  subtitle: string;
  queryLabel: string;
  queryPlaceholder: string;
  queryAs?: "topic" | "userQuestions";
  multiline?: boolean;
  defaultOptions?: PromptOptions;
  controls?: (o: PromptOptions, set: (patch: Partial<PromptOptions>) => void) => React.ReactNode;
  modeSelector?: React.ReactNode;
}) {
  const { state } = useStore();
  const [selected, setSelected] = useState<string[]>(state.sources.map((s) => s.id));
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PromptOptions>(defaultOptions);

  const setOpt = (patch: Partial<PromptOptions>) => setOptions((o) => ({ ...o, ...patch }));

  const selectedSources = useMemo(
    () => state.sources.filter((s) => selected.includes(s.id)),
    [state.sources, selected]
  );

  // Retrieve across ALL sources so evidence can surface even un-selected notes.
  const retrievalQuery = query.trim() || state.profile.topics.join(" ");
  const evidence = useMemo(
    () => retrieveRelevantSources(retrievalQuery, state.sources),
    [retrievalQuery, state.sources]
  );

  const weakTopics = state.weakTopics.filter((t) => t.confidence <= 2).map((t) => t.topic);

  const prompt = useMemo(() => {
    const opts: PromptOptions = { ...options, weakTopics };
    if (query.trim()) {
      if (queryAs === "topic") opts.topic = query.trim();
      else opts.userQuestions = query.trim();
    }
    return generatePrompt(mode, {
      modes: state.modes,
      profile: state.profile,
      sources: selectedSources,
      evidence,
      options: opts,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, options, query, queryAs, state.modes, state.profile, selectedSources, evidence]);

  return (
    <div className="space-y-5">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} right={<StatusBadges />} />

      {modeSelector}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel>
            <Field label={queryLabel} hint="Drives Mnemosyne Lite retrieval below.">
              {multiline ? (
                <textarea className="textarea" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={queryPlaceholder} />
              ) : (
                <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={queryPlaceholder} />
              )}
            </Field>
            {controls && <div className="mt-4 space-y-4">{controls(options, setOpt)}</div>}
          </Panel>

          <Panel>
            <SectionTitle icon="📚" title="Sources" subtitle="Material embedded into the prompt." />
            <SourceSelect selected={selected} onChange={setSelected} />
          </Panel>

          <ModeBar />
        </div>

        <div className="space-y-4">
          <Panel>
            <SectionTitle icon="🔎" title="Mnemosyne Lite — Retrieved Evidence" subtitle="Shown before generation. Source-locked prompts anchor to this." />
            <EvidencePanel results={evidence} />
          </Panel>
        </div>
      </div>

      <PromptWorkspace mode={mode} prompt={prompt} sourceIds={selected} />
      <Disclaimer />
    </div>
  );
}
