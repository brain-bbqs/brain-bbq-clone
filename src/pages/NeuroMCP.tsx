import { useState, useRef, useEffect } from "react";
import { Send, Lock, Loader2, Database, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AdminPanel } from "@/components/neuromcp/AdminPanel";
import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  contextSources?: { type: string; title: string }[];
  imageUrl?: string;
  isProcessing?: boolean;
}

const isMitEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith("@mit.edu");
};

export default function NeuroMCP() {
  const { user, loading, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi, I'm Hannah. Ask me anything about BBQS projects, publications, or investigators. You can also upload a .wav file for USV detection.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = user && isMitEmail(user.email);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAudioUpload = async (file: File) => {
    if (!session || !user) return;

    if (!file.name.toLowerCase().endsWith(".wav")) {
      toast.error("Please upload a .wav file");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🎵 Uploaded: ${file.name}`,
      timestamp: new Date(),
    };

    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Analyzing audio for USV detections... This may take a moment.",
      timestamp: new Date(),
      isProcessing: true,
    };

    setMessages((prev) => [...prev, userMessage, processingMessage]);
    setIsLoading(true);

    try {
      // Resumable upload via tus protocol
      const audioPath = `uploads/${user.id}/${Date.now()}_${file.name}`;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            "x-upsert": "false",
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "neuromcp-audio",
            objectName: audioPath,
            contentType: "audio/wav",
            cacheControl: "3600",
          },
          chunkSize: 6 * 1024 * 1024, // 6MB chunks
          onError: (error) => {
            console.error("Upload error:", error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress(pct);
          },
          onSuccess: () => {
            setUploadProgress(null);
            resolve();
          },
        });
        upload.findPreviousUploads().then((prev) => {
          if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
          upload.start();
        });
      });

      // Call audio processing edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ audioPath }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Processing failed");

      // Replace processing message with result
      const resultMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: data.detections
          ? `USV detection complete for **${file.name}**.\n\n${typeof data.detections === "string" ? data.detections : JSON.stringify(data.detections, null, 2)}`
          : `USV detection complete for **${file.name}**. See the annotated spectrogram below.`,
        timestamp: new Date(),
        imageUrl: data.spectrogramUrl,
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== processingMessage.id).concat(resultMessage)
      );
    } catch (error) {
      console.error("Audio processing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process audio");

      setMessages((prev) =>
        prev.filter((m) => m.id !== processingMessage.id).concat({
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "I encountered an error processing the audio file. Please try again.",
          timestamp: new Date(),
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuromcp-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        contextSources: data.contextSources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] max-w-3xl mx-auto px-4 sm:px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3rem)] max-w-lg mx-auto px-4 sm:px-6 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
          <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3">Access Restricted</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          NeuroMCP is only available to users with an MIT email address. 
          {!user 
            ? " Please sign in with your @mit.edu email to access this feature."
            : " Your current email is not authorized. Please sign in with your @mit.edu email."}
        </p>
        {!user ? (
          <Link to="/auth">
            <Button className="gap-2 w-full sm:w-auto">
              Sign In with MIT Email
            </Button>
          </Link>
        ) : (
          <Button variant="outline" onClick={() => window.location.href = "/auth"} className="w-full sm:w-auto">
            Sign In with Different Account
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-w-3xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="pt-4 sm:pt-8 pb-4 sm:pb-6 text-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Hannah</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">Your BBQS research assistant</p>
      </div>

      {/* Admin Panel */}
      {session && <AdminPanel accessToken={session.access_token} />}

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2">
        <div className="space-y-6 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" ? (
                <div className="max-w-[90%] sm:max-w-[85%] space-y-2">
                  <div className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base">
                    {message.isProcessing && (
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    )}
                    {message.content}
                  </div>
                  {message.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border">
                      <img
                        src={message.imageUrl}
                        alt="Annotated spectrogram with USV detections"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {message.contextSources && message.contextSources.length > 0 && (
                    <div className="flex items-start sm:items-center gap-1.5 text-xs text-muted-foreground/70">
                      <Database className="h-3 w-3 shrink-0 mt-0.5 sm:mt-0" />
                      <span className="break-words">
                        Sources: {message.contextSources.map(s => s.title).slice(0, 2).join(", ")}
                        {message.contextSources.length > 2 && ` +${message.contextSources.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-secondary text-foreground rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 max-w-[90%] sm:max-w-[85%] text-sm sm:text-base">
                  {message.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && !messages.some((m) => m.isProcessing) && (
            <div className="flex justify-start">
              <div className="inline-flex gap-1 px-2">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAudioUpload(file);
          e.target.value = "";
        }}
      />

      {/* Input */}
      <div className="py-3 sm:py-4">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/50 rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Upload .wav file for USV detection"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about BBQS or upload a .wav file..."
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
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
