import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Coffee, UtensilsCrossed, Wine, Calendar } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { WORKSHOP_MENU, type Meal } from "@/data/mit-workshop-2026";
import coffeeImg from "@/assets/menu-coffee.jpg";
import greekImg from "@/assets/menu-greek.jpg";
import italianImg from "@/assets/menu-italian.jpg";
import burritoImg from "@/assets/menu-burrito.jpg";
import happyHourImg from "@/assets/menu-happyhour.jpg";

const DAYS = [
  { key: "Day 1 — Wed, Jul 15", label: "Day 1", date: "Wed · Jul 15" },
  { key: "Day 2 — Thu, Jul 16", label: "Day 2", date: "Thu · Jul 16" },
  { key: "Day 3 — Fri, Jul 17", label: "Day 3", date: "Fri · Jul 17" },
];

const MEAL_ART: Record<string, { img: string; icon: typeof Coffee; tag: string; accent: string }> = {
  "d1-coffee-am": { img: coffeeImg, icon: Coffee, tag: "Morning", accent: "from-amber-500/60 to-transparent" },
  "d1-lunch":     { img: greekImg,   icon: UtensilsCrossed, tag: "Lunch · 12:30", accent: "from-orange-500/70 to-transparent" },
  "d1-happy":     { img: happyHourImg, icon: Wine, tag: "Evening", accent: "from-rose-500/60 to-transparent" },
  "d2-coffee-am": { img: coffeeImg, icon: Coffee, tag: "Morning", accent: "from-amber-500/60 to-transparent" },
  "d2-lunch":     { img: italianImg, icon: UtensilsCrossed, tag: "Lunch · 12:30", accent: "from-orange-500/70 to-transparent" },
  "d2-happy":     { img: happyHourImg, icon: Wine, tag: "Evening", accent: "from-rose-500/60 to-transparent" },
  "d3-coffee-am": { img: coffeeImg, icon: Coffee, tag: "Morning", accent: "from-amber-500/60 to-transparent" },
  "d3-lunch":     { img: burritoImg, icon: UtensilsCrossed, tag: "Lunch · 12:30", accent: "from-orange-500/70 to-transparent" },
};

function MealCard({ meal }: { meal: Meal }) {
  const art = MEAL_ART[meal.key];
  const Icon = art?.icon ?? UtensilsCrossed;
  return (
    <Card className="overflow-hidden border-border/60 group hover:border-primary/40 transition-colors">
      {art?.img && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={art.img}
            alt={meal.label}
            loading="lazy"
            width={1024}
            height={1024}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${art.accent} mix-blend-multiply opacity-40`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
          <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur text-foreground border-border/60">
            {art.tag}
          </Badge>
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground shadow-md">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground drop-shadow-sm leading-tight">
              {meal.label}
            </h3>
          </div>
        </div>
      )}
      <CardContent className="pt-3 pb-4">
        <ul className="flex flex-wrap gap-1.5">
          {meal.items.map((item) => (
            <li
              key={item}
              className="text-[11px] text-muted-foreground bg-muted/60 border border-border/50 rounded-full px-2 py-0.5"
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

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
      <div className="container max-w-6xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60">
          <img
            src={greekImg}
            alt="Workshop catering"
            width={1024}
            height={1024}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-12">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold mb-3">
              <ChefHat className="h-4 w-4" /> Catering
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-xl">
              Workshop Menu
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              2<sup>nd</sup> Annual BBQS Workshop · MIT · July 15–17, 2026. Three days of themed lunches,
              happy-hour receptions, and all-day coffee & tea.
            </p>
          </div>
        </div>

        {/* Day sections */}
        {DAYS.map((day) => {
          const meals = WORKSHOP_MENU.filter((m) => m.day === day.key);
          return (
            <section key={day.key} className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {day.label}
                </h2>
                <span className="text-xs text-muted-foreground">{day.date}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {meals.map((meal) => <MealCard key={meal.key} meal={meal} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}