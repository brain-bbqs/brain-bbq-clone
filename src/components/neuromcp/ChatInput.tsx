import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border/50 px-3 sm:px-6 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/50 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 border border-border/50">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about BBQS projects, workflows, publications..."
            disabled={disabled}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          <Button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            size="icon"
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
