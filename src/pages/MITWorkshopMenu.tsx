import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Coffee, UtensilsCrossed, Wine, ChevronLeft, ChevronRight } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { WORKSHOP_MENU, type Meal } from "@/data/mit-workshop-2026";
import coffeeImg from "@/assets/menu-coffee.jpg";
import greekImg from "@/assets/menu-greek.jpg";
import italianImg from "@/assets/menu-italian.jpg";
import burritoImg from "@/assets/menu-burrito.jpg";
import happyHourImg from "@/assets/menu-happyhour.jpg";

type DayPanel = {
  key: string;
  label: string;
  date: string;
  heroImg: string;
  heroTitle: string;
};

const DAYS: DayPanel[] = [
  { key: "Day 1 — Wed, Jul 15", label: "Day 1", date: "Wednesday · July 15", heroImg: greekImg, heroTitle: "Greek Mediterranean Feast" },
  { key: "Day 2 — Thu, Jul 16", label: "Day 2", date: "Thursday · July 16",  heroImg: italianImg, heroTitle: "Italian Feast" },
  { key: "Day 3 — Fri, Jul 17", label: "Day 3", date: "Friday · July 17",   heroImg: burritoImg, heroTitle: "BYO Burrito Bowl" },
];

const MEAL_ART: Record<string, { img: string; icon: typeof Coffee; tag: string }> = {
  "d1-coffee-am": { img: coffeeImg,   icon: Coffee,          tag: "Morning" },
  "d1-lunch":     { img: greekImg,    icon: UtensilsCrossed, tag: "Lunch · 12:30" },
  "d1-happy":     { img: happyHourImg, icon: Wine,           tag: "Happy Hour" },
  "d2-coffee-am": { img: coffeeImg,   icon: Coffee,          tag: "Morning" },
  "d2-lunch":     { img: italianImg,  icon: UtensilsCrossed, tag: "Lunch · 12:30" },
  "d2-happy":     { img: happyHourImg, icon: Wine,           tag: "Happy Hour" },
  "d3-coffee-am": { img: coffeeImg,   icon: Coffee,          tag: "Morning" },
  "d3-lunch":     { img: burritoImg,  icon: UtensilsCrossed, tag: "Lunch · 12:30" },
};

function MealBlock({ meal }: { meal: Meal }) {
  const art = MEAL_ART[meal.key];
  const Icon = art?.icon ?? UtensilsCrossed;
  return (
    <div className="grid sm:grid-cols-[180px_1fr] gap-4 rounded-xl border border-border/60 overflow-hidden bg-card/40 hover:border-primary/40 transition-colors">
      <div className="relative h-40 sm:h-full min-h-[140px]">
        <img
          src={art?.img}
          alt={meal.label}
          loading="lazy"
          width={1024}
          height={1024}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-card/90 sm:from-transparent via-card/20 sm:via-transparent to-transparent" />
        <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground border-border/60 gap-1">
          <Icon className="h-3 w-3" /> {art?.tag}
        </Badge>
      </div>
      <div className="p-4 pt-0 sm:pt-4">
        <h3 className="text-base font-semibold text-foreground mb-2">{meal.label}</h3>
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
      </div>
    </div>
  );
}

function DayPanelCard({ day }: { day: DayPanel }) {
  const meals = WORKSHOP_MENU.filter((m) => m.day === day.key);
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* Day hero */}
      <div className="relative h-48 sm:h-56">
        <img
          src={day.heroImg}
          alt={day.heroTitle}
          width={1024}
          height={1024}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold">{day.date}</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground drop-shadow-sm">{day.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">Featured lunch: {day.heroTitle}</p>
        </div>
      </div>
      {/* Meals */}
      <div className="p-4 sm:p-5 space-y-3">
        {meals.map((meal) => <MealBlock key={meal.key} meal={meal} />)}
      </div>
    </div>
  );
}

export default function MITWorkshopMenu() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (loading || !user) return null;

  return (
    <>
      <PageMeta
        title="MIT Workshop 2026 – Menu | BBQS"
        description="Catering menu for the BBQS MIT Workshop, July 15-17, 2026."
      />
      <div className="container max-w-5xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ChefHat className="h-7 w-7 text-primary" /> Workshop Menu
            </h1>
            <p className="text-muted-foreground text-sm">
              2<sup>nd</sup> Annual BBQS Workshop · MIT · July 15–17, 2026 · Slide between days
            </p>
          </div>
          {/* Day pills / navigation */}
          <div className="flex items-center gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={d.key}
                onClick={() => api?.scrollTo(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  current === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border/60 hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliding day panels */}
        <div className="relative">
          <Carousel setApi={setApi} opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-4">
              {DAYS.map((day) => (
                <CarouselItem key={day.key} className="pl-4 basis-full">
                  <DayPanelCard day={day} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Prev / Next */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => api?.scrollPrev()}
              disabled={current === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous day
            </Button>
            <div className="flex items-center gap-2">
              {DAYS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    current === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => api?.scrollNext()}
              disabled={current === DAYS.length - 1}
              className="gap-1"
            >
              Next day <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}