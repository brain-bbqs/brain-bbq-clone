import { useState } from "react";
import { InteractionalLayer } from "./InteractionalLayer";
import { CognitiveLayer } from "./CognitiveLayer";
import { RelationalLayer } from "./RelationalLayer";

type LayerKey = "interactional" | "cognitive" | "relational";

const LAYERS: { key: LayerKey; label: string; scale: string; blurb: string }[] = [
  { key: "interactional", label: "Interactional", scale: "micro", blurb: "word reuse · linguistic entrainment" },
  { key: "cognitive",     label: "Cognitive",     scale: "meso",  blurb: "shared attention · shared mental models" },
  { key: "relational",    label: "Relational",    scale: "macro", blurb: "group identity · social cohesion" },
];

export function LayerTabs() {
  const [active, setActive] = useState<LayerKey>("interactional");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {LAYERS.map((l) => {
          const on = active === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setActive(l.key)}
              className={`text-left rounded-lg border p-3 transition ${
                on ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <div className={`text-sm font-semibold ${on ? "text-primary" : "text-foreground"}`}>{l.label}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l.scale}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{l.blurb}</div>
            </button>
          );
        })}
      </div>
      <div>
        {active === "interactional" && <InteractionalLayer />}
        {active === "cognitive"     && <CognitiveLayer />}
        {active === "relational"    && <RelationalLayer />}
      </div>
    </div>
  );
}