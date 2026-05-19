import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollText, ThumbsUp, ThumbsDown, HelpCircle, ChevronLeft, ChevronRight, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { DATA_POLICY_QUIZ } from "@/data/data-policy-quiz";

type Answer = "yes" | "no" | "unsure";

interface Props {
  userId: string;
}

export function DataPolicyQuiz({ userId }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["data-policy-quiz", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_policy_quiz_responses")
        .select("question_id, answer, updated_at")
        .eq("user_id", userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const answerMap = useMemo(() => {
    const m = new Map<string, Answer>();
    responses.forEach((r: any) => m.set(r.question_id, r.answer as Answer));
    return m;
  }, [responses]);

  const answered = answerMap.size;
  const total = DATA_POLICY_QUIZ.length;
  const completed = answered === total;

  const saveAnswer = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: Answer }) => {
      const { error } = await supabase
        .from("data_policy_quiz_responses")
        .upsert(
          { user_id: userId, question_id: questionId, answer },
          { onConflict: "user_id,question_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-policy-quiz", userId] });
    },
    onError: () => toast.error("Failed to save answer"),
  });

  const resetQuiz = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("data_policy_quiz_responses")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-policy-quiz", userId] });
      setStep(0);
      setReviewMode(false);
      toast.success("Quiz reset");
    },
  });

  const handleAnswer = async (answer: Answer) => {
    const q = DATA_POLICY_QUIZ[step];
    await saveAnswer.mutateAsync({ questionId: q.id, answer });
    if (step < total - 1) setStep(step + 1);
    else setReviewMode(true);
  };

  if (reviewMode || (completed && !isLoading && step === 0 && answered === total)) {
    return (
      <Card id="data-policy-quiz" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Data Sharing Policy — Your Positions
            </CardTitle>
            <Badge variant="secondary">{answered}/{total}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Your responses are saved to your profile and help shape the upcoming policy vote.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {DATA_POLICY_QUIZ.map((q) => {
            const a = answerMap.get(q.id);
            return (
              <div key={q.id} className="border border-border rounded-md p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{q.category}</p>
                    <p className="font-medium text-foreground mt-0.5">{q.shortLabel}</p>
                  </div>
                  {a && (
                    <Badge
                      variant={a === "yes" ? "default" : a === "no" ? "destructive" : "secondary"}
                      className="uppercase text-[10px]"
                    >
                      {a}
                    </Badge>
                  )}
                </div>
                {a && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {a === "yes" ? q.yesMeans : a === "no" ? q.noMeans : "Marked as unsure."}
                  </p>
                )}
              </div>
            );
          })}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setReviewMode(false); setStep(0); }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Review one by one
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetQuiz.mutate()}
              disabled={resetQuiz.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const q = DATA_POLICY_QUIZ[step];
  const current = answerMap.get(q.id);

  return (
    <Card id="data-policy-quiz" className="scroll-mt-20">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Data Sharing Policy Quiz
          </CardTitle>
          <Badge variant="secondary">Question {step + 1} / {total}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          A quick yes / no on 10 governance tradeoffs. Your answers are saved to your profile and inform the
          consortium vote.
        </p>
        <Progress value={((step + (current ? 1 : 0)) / total) * 100} className="mt-3 h-1.5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{q.category}</p>
          <p className="text-sm font-medium text-foreground mt-1">{q.shortLabel}</p>
          <p className="text-sm text-foreground/90 mt-2">{q.prompt}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant={current === "yes" ? "default" : "outline"}
            onClick={() => handleAnswer("yes")}
            disabled={saveAnswer.isPending}
            className="justify-start"
          >
            <ThumbsUp className="h-4 w-4 mr-2" /> Yes
            {current === "yes" && <Check className="h-3.5 w-3.5 ml-auto" />}
          </Button>
          <Button
            variant={current === "no" ? "destructive" : "outline"}
            onClick={() => handleAnswer("no")}
            disabled={saveAnswer.isPending}
            className="justify-start"
          >
            <ThumbsDown className="h-4 w-4 mr-2" /> No
            {current === "no" && <Check className="h-3.5 w-3.5 ml-auto" />}
          </Button>
          <Button
            variant={current === "unsure" ? "secondary" : "outline"}
            onClick={() => handleAnswer("unsure")}
            disabled={saveAnswer.isPending}
            className="justify-start"
          >
            <HelpCircle className="h-4 w-4 mr-2" /> Unsure
            {current === "unsure" && <Check className="h-3.5 w-3.5 ml-auto" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="border border-border rounded p-2">
            <span className="font-medium text-foreground">Yes →</span> {q.yesMeans}
          </div>
          <div className="border border-border rounded p-2">
            <span className="font-medium text-foreground">No →</span> {q.noMeans}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">{answered} answered</span>
          {step < total - 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step + 1)}>
              Skip <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReviewMode(true)}
              disabled={answered === 0}
            >
              Review <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
