import { useState, useCallback } from "react";
import { Plus, X, Pencil, Check, Braces } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomMetadataEditorProps {
  metadata: Record<string, any>;
  onChange: (metadata: Record<string, any>) => void;
  isChanged: boolean;
}

export function CustomMetadataEditor({ metadata, onChange, isChanged }: CustomMetadataEditorProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const entries = Object.entries(metadata || {});

  const addEntry = useCallback(() => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;
    onChange({ ...metadata, [key]: value });
    setNewKey("");
    setNewValue("");
  }, [newKey, newValue, metadata, onChange]);

  const removeEntry = useCallback((key: string) => {
    const next = { ...metadata };
    delete next[key];
    onChange(next);
  }, [metadata, onChange]);

  const startEditValue = useCallback((key: string) => {
    setEditingKey(key);
    setEditDraft(typeof metadata[key] === "string" ? metadata[key] : JSON.stringify(metadata[key]));
  }, [metadata]);

  const saveEditValue = useCallback(() => {
    if (!editingKey) return;
    onChange({ ...metadata, [editingKey]: editDraft });
    setEditingKey(null);
  }, [editingKey, editDraft, metadata, onChange]);

  return (
    <div className={cn(
      "space-y-3 p-3 rounded-xl border transition-colors",
      isChanged ? "bg-amber-500/10 border-amber-500/20" : "bg-card border-border"
    )}>
      <div className="flex items-center gap-2">
        <Braces className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1">
          Custom Metadata
        </p>
        {isChanged && (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Modified</span>
        )}
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground/50 italic">No custom fields yet</p>
      )}

      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 group">
          <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5 font-mono">
            {key}
          </Badge>
          {editingKey === key ? (
            <div className="flex-1 flex items-center gap-1">
              <input
                value={editDraft}
                onChange={e => setEditDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEditValue(); if (e.key === "Escape") setEditingKey(null); }}
                className="flex-1 text-xs bg-muted/50 border border-border rounded px-2 py-1 outline-none focus:border-primary/50"
                autoFocus
              />
              <button onClick={saveEditValue} className="p-1 rounded bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-foreground flex-1 break-all">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </p>
          )}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {editingKey !== key && (
              <button onClick={() => startEditValue(key)} className="p-0.5 rounded hover:bg-muted">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <button onClick={() => removeEntry(key)} className="p-0.5 rounded hover:bg-destructive/10">
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      ))}

      {/* Add new entry */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
        <input
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          placeholder="Key"
          className="w-24 text-xs bg-muted/50 border border-border rounded px-2 py-1.5 outline-none focus:border-primary/50 font-mono"
          onKeyDown={e => { if (e.key === "Enter") addEntry(); }}
        />
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="Value"
          className="flex-1 text-xs bg-muted/50 border border-border rounded px-2 py-1.5 outline-none focus:border-primary/50"
          onKeyDown={e => { if (e.key === "Enter") addEntry(); }}
        />
        <button
          onClick={addEntry}
          disabled={!newKey.trim() || !newValue.trim()}
          className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
