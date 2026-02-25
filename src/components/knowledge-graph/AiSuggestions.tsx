import { useState, useCallback } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AiSuggestionsProps {
  grantTitle: string;
  grantAbstract: string | null;
  existingFields: Record<string, any>;
  similarProjects: Record<string, any>[];
  onApplySuggestion: (fieldKey: string, value: any) => void;
}

interface Suggestion {
  [key: string]: any;
  reasoning?: string;
}

const FIELD_LABELS: Record<string, string> = {
  study_species: "Species",
  use_approaches: "Approaches",
  use_sensors: "Sensors",
  produce_data_modality: "Data Modalities",
  use_analysis_method: "Analysis Methods",
  keywords: "Keywords",
};

export function AiSuggestions({
  grantTitle,
  grantAbstract,
  existingFields,
  similarProjects,
  onApplySuggestion,
}: AiSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setSuggestions(null);
    setAppliedFields(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("metadata-suggest", {
        body: {
          grantTitle,
          grantAbstract,
          existingFields,
          similarProjects: similarProjects.slice(0, 3),
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return;
      }

      setSuggestions(data.suggestions || null);
    } catch (e: any) {
      console.error("AI suggestion error:", e);
      toast({ title: "Failed to get suggestions", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [grantTitle, grantAbstract, existingFields, similarProjects]);

  const applySuggestion = useCallback((fieldKey: string) => {
    if (!suggestions || !suggestions[fieldKey]) return;
    onApplySuggestion(fieldKey, suggestions[fieldKey]);
    setAppliedFields(prev => new Set([...prev, fieldKey]));
  }, [suggestions, onApplySuggestion]);

  const suggestableFields = suggestions
    ? Object.entries(suggestions).filter(
        ([key, val]) => key !== "reasoning" && val && Array.isArray(val) && val.length > 0
      )
    : [];

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1">
          AI Suggestions
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading}
          className="h-7 text-xs gap-1.5"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Analyzing..." : suggestions ? "Re-analyze" : "Suggest Fields"}
        </Button>
      </div>

      {suggestions && (
        <div className="space-y-3">
          {suggestions.reasoning && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
              {suggestions.reasoning}
            </p>
          )}

          {suggestableFields.length === 0 && (
            <p className="text-xs text-muted-foreground">No new suggestions — fields are already well populated.</p>
          )}

          {suggestableFields.map(([key, values]) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-foreground">{FIELD_LABELS[key] || key}</p>
                {appliedFields.has(key) ? (
                  <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/15 text-emerald-400">
                    <Check className="h-2.5 w-2.5" /> Applied
                  </Badge>
                ) : (
                  <button
                    onClick={() => applySuggestion(key)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Apply
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {(values as string[]).map((v: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal bg-primary/5 border-primary/20">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
