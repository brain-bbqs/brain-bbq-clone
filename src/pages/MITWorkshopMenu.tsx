import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Utensils } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { WORKSHOP_MENU } from "@/data/mit-workshop-2026";

const DAYS = [
  "Day 1 — Wed, Jul 15",
  "Day 2 — Thu, Jul 16",
  "Day 3 — Fri, Jul 17",
];

export default function MITWorkshopMenu() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <>
      <PageMeta
        title="MIT Workshop 2026 – Menu | BBQS"
        description="Catering menu for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-5xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-primary" /> Workshop Menu
          </h1>
          <p className="text-muted-foreground">
            2<sup>nd</sup> Annual BBQS Workshop · MIT · July 15–17, 2026
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {DAYS.map((day) => {
            const meals = WORKSHOP_MENU.filter((m) => m.day === day);
            return (
              <Card key={day} className="border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meals.map((meal) => (
                    <div key={meal.key}>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Utensils className="h-3.5 w-3.5 text-orange-500" />
                        {meal.label}
                      </div>
                      <ul className="mt-1.5 ml-1 text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                        {meal.items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}