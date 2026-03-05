import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceAgentButtonProps {
  className?: string;
}

export function VoiceAgentButton({ className }: VoiceAgentButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      toast.success("Voice agent connected — start speaking!");
    },
    onDisconnect: () => {
      toast.info("Voice conversation ended.");
    },
    onError: (error) => {
      console.error("Voice agent error:", error);
      toast.error("Voice connection error. Please try again.");
    },
  });

  const isConnected = conversation.status === "connected";

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error) throw error;
      if (!data?.token) throw new Error("No token received");

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (err: any) {
      console.error("Failed to start voice:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Microphone access is required for voice mode.");
      } else {
        toast.error(err.message || "Failed to connect voice agent.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isConnected ? (
        <>
          {/* Pulsing indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary animate-pulse">
            <Volume2 className="h-3.5 w-3.5" />
            <span>{conversation.isSpeaking ? "Speaking..." : "Listening..."}</span>
          </div>
          <Button
            onClick={stopConversation}
            size="icon"
            variant="destructive"
            className="h-10 w-10 rounded-full shadow-md"
          >
            <MicOff className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          onClick={startConversation}
          disabled={isConnecting}
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 shadow-sm transition-all"
          title="Start voice conversation"
        >
          {isConnecting ? (
            <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          ) : (
            <Mic className="h-4 w-4 text-primary" />
          )}
        </Button>
      )}
    </div>
  );
}
