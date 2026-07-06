export type Meal = {
  key: string;
  day: string;
  label: string;
  items: string[];
};

export const WORKSHOP_MENU: Meal[] = [
  { key: "d1-coffee-am", day: "Day 1 — Wed, Jul 15", label: "Coffee & Tea Service", items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d1-lunch", day: "Day 1 — Wed, Jul 15", label: "BYO — Greek Mediterranean Feast",
    items: ["Greek Chicken", "Greek Steak Tips", "Falafel", "Lemon Rice", "Roasted Veggies", "Lettuce", "Assorted Toppings", "Dessert"] },
  { key: "d1-happy", day: "Day 1 — Wed, Jul 15", label: "Happy Hour Reception",
    items: ["Charcuterie & Cheese Platter, Fruit & Crostini", "Veggie Platter — Hummus & Tzatziki, Pita Chips", "Spinach & Artichoke Dip, Pita Chips", "Pastry Cups with Cheese & Fig", "Veggie Samosas", "Stuffed Mushrooms", "Burger Sliders", "Chicken Skewers", "Steak Skewers", "Shrimp Skewers", "Cookies & Brownies"] },

  { key: "d2-coffee-am", day: "Day 2 — Thu, Jul 16", label: "Coffee & Tea Service", items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d2-lunch", day: "Day 2 — Thu, Jul 16", label: "Italian Feast",
    items: ["Meatballs", "Chicken Cutlet", "Chicken Piccata", "Broccoli Alfredo", "Roasted Veggies", "Pasta", "Marinara", "Salads", "Garlic Bread", "Dessert"] },
  { key: "d2-happy", day: "Day 2 — Thu, Jul 16", label: "Happy Hour Reception",
    items: ["Charcuterie & Cheese Platter, Fruit & Crostini", "Veggie Platter — Hummus & Tzatziki, Pita Chips", "Spinach & Artichoke Dip, Pita Chips", "Pastry Cups with Cheese & Fig", "Veggie Samosas", "Cheese Arancini Balls", "Chicken Sliders", "Vegan Sliders", "BBQ Chicken Skewers", "Steak Skewers", "Shrimp Cocktail", "Cookies & Brownies"] },

  { key: "d3-coffee-am", day: "Day 3 — Fri, Jul 17", label: "Coffee & Tea Service", items: ["Freshly brewed coffee", "Assorted teas"] },
  { key: "d3-lunch", day: "Day 3 — Fri, Jul 17", label: "BYO Burrito Bowl",
    items: ["Chicken Chipotle", "Taco Beef", "Grilled Shrimp", "Vegan Taco Meat", "Rice", "Black Beans", "Assorted Toppings", "Dessert"] },
];

export const MEAL_BY_KEY: Record<string, Meal> = Object.fromEntries(WORKSHOP_MENU.map((m) => [m.key, m]));

export type SpeakerEntry = { name: string; affiliation?: string; role: string; when: string };

export const SPEAKERS: SpeakerEntry[] = [
  { name: "TBD", affiliation: "NIH", role: "Introduction — Scientific & Technological Goals", when: "Wed Jul 15 · 10:00 AM" },
  { name: "Satra Ghosh", affiliation: "MIT", role: "Highlight: Last Year's BBQS Consortia — What's New?", when: "Wed Jul 15 · 10:15 AM" },
  { name: "BBQS Project Leads", role: "Data Pipeline Blitz (round-robin)", when: "Wed Jul 15 · 10:30 AM" },
  { name: "Brainhack Session Leads", role: "Report Back from Day 1", when: "Thu Jul 16 · 10:00 AM" },
  { name: "Satra Ghosh", affiliation: "MIT", role: "Option A — AI Literacy to Liability", when: "Thu Jul 16 · 11:30 AM" },
  { name: "WG-ELSI Chairs", role: "Option B — Office Hours, pre-voting data-sharing discussion", when: "Thu Jul 16 · 11:30 AM" },
  { name: "Consortium PIs", role: "Policy Formation Forum — voting + Grants/Budgets", when: "Thu Jul 16 · 2:30 PM" },
  { name: "Young Investigator lead (TBD)", role: "Young Investigator unconference", when: "Thu Jul 16 · 2:30 PM" },
  { name: "Brainhack Leads · Open Mic", role: "Final project reports & town hall", when: "Fri Jul 17 · 12:30 PM" },
];