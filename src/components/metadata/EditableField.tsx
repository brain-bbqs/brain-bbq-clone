import { useState, useRef, useCallback } from "react";
import { Pencil, X, Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value: any;
  type?: "text" | "tags" | "boolean" | "link" | "textarea";
  fieldKey: string;
  isChanged: boolean;
  onSave: (fieldKey: string, value: any) => void;
}

export function EditableField({ label, value, type = "text", fieldKey, isChanged, onSave }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>(value);
  const [tagInput, setTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const isEmpty = value === null || value === undefined || value === "" ||
    (Array.isArray(value) && value.length === 0);

  const startEdit = useCallback(() => {
    setDraft(value);
    setTagInput("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [value]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft(value);
  }, [value]);

  const saveEdit = useCallback(() => {
    onSave(fieldKey, draft);
    setEditing(false);
  }, [onSave, fieldKey, draft]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag) return;
    const currentTags = Array.isArray(draft) ? draft : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setDraft(newTags);
      onSave(fieldKey, newTags);
    }
    setTagInput("");
  }, [tagInput, draft, onSave, fieldKey]);

  const removeTag = useCallback((tag: string) => {
    const newTags = (Array.isArray(draft) ? draft : []).filter((t: string) => t !== tag);
    setDraft(newTags);
    onSave(fieldKey, newTags);
  }, [draft, onSave, fieldKey]);

  const toggleBoolean = useCallback(() => {
    const newVal = !value;
    onSave(fieldKey, newVal);
  }, [value, onSave, fieldKey]);

  return (
    <div className={cn(
      "space-y-1 p-2.5 -mx-2.5 rounded-lg transition-colors",
      isChanged && "bg-amber-500/10 border border-amber-500/20"
    )}>
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1">{label}</p>
        {isChanged && (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Modified</span>
        )}
        {type === "boolean" ? (
          <button onClick={toggleBoolean} className="p-1 rounded hover:bg-muted transition-colors" title="Toggle">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        ) : !editing && (
          <button onClick={startEdit} className="p-1 rounded hover:bg-muted transition-colors" title="Edit">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Boolean */}
      {type === "boolean" && (
        <p className="text-sm text-foreground">{value ? "Yes" : "No"}</p>
      )}

      {/* Tags — always show, with inline add */}
      {type === "tags" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {Array.isArray(value) && value.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal gap-1 pr-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {isEmpty && !editing && (
              <p className="text-sm text-muted-foreground/50 italic">Not set</p>
            )}
          </div>
          {editing && (
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } if (e.key === "Escape") cancelEdit(); }}
                placeholder="Add tag..."
                className="flex-1 text-sm bg-muted/50 border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary/50"
              />
              <button onClick={addTag} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button onClick={cancelEdit} className="p-1.5 rounded-md hover:bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text / Link / Textarea editing */}
      {(type === "text" || type === "link" || type === "textarea") && (
        editing ? (
          <div className="space-y-1.5">
            {type === "textarea" ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={draft ?? ""}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") cancelEdit(); }}
                rows={4}
                className="w-full text-sm bg-muted/50 border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary/50 resize-y"
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={draft ?? ""}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                className="w-full text-sm bg-muted/50 border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary/50"
              />
            )}
            <div className="flex gap-1">
              <button onClick={saveEdit} className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={cancelEdit} className="p-1 rounded-md hover:bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : (
          isEmpty ? (
            <p className="text-sm text-muted-foreground/50 italic">Not set</p>
          ) : type === "link" ? (
            <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
              {String(value)}
            </a>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{String(value)}</p>
          )
        )
      )}
    </div>
  );
}
