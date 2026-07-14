## Plan: Astrological Sign Layer for Investigators

Add birthday + zodiac sign as a lightweight "vibes" pairing signal alongside personality scoring, then re-visit seating.

### 1. Data model
- Add two columns to `public.investigators`:
  - `birthday date` (nullable)
  - `zodiac_sign text` (nullable, generated on write via trigger from `birthday` using standard date ranges)
- Trigger `set_zodiac_from_birthday()` auto-fills `zodiac_sign` whenever `birthday` changes (Aries…Pisces, western tropical dates).
- No new grants required — RLS on investigators already covers read/update.

### 2. Admin entry UI
- On `/internal-coordination` (Cognitive Layer), add a compact "Birthdays" admin panel (admin-only):
  - Searchable list of all 180 investigators
  - Inline date picker per row → updates `birthday`; sign auto-derived server-side
  - Bulk paste (CSV: `name,YYYY-MM-DD`) for fast entry
- Progress indicator: "X of 180 birthdays entered".

### 3. Zodiac bar chart
- New `ZodiacDistribution.tsx` card on `/internal-coordination`:
  - Bar chart of counts per sign across all investigators (12 bars, ordered Aries→Pisces)
  - Hover → list of investigators for that sign
  - Split toggle: All / R61 / R34 cohort

### 4. Pairing metric
- Extend the existing seating/pairing logic on `/mit-workshop-2026/seating` to include a zodiac compatibility score:
  - Element groups: Fire (Aries, Leo, Sagittarius), Earth (Taurus, Virgo, Capricorn), Air (Gemini, Libra, Aquarius), Water (Cancer, Scorpio, Pisces)
  - Compatibility: same element = +1.0, complementary (Fire↔Air, Earth↔Water) = +0.5, otherwise 0
  - Blended into existing pairing score with a small weight (default 0.15, tunable via a slider in the seating page)
  - Missing birthday → zodiac contribution = 0 (neutral)

### 5. Reseating pass
- After birthdays are populated, the seating page will automatically re-score with the zodiac component. A "Re-evaluate seating" button on `/mit-workshop-2026/seating` triggers a fresh pairing pass and shows a diff (who moved).

### Files
- `supabase/migrations/…` — add `birthday`, `zodiac_sign`, trigger
- `src/components/social-force-field/BirthdayAdmin.tsx` — entry panel
- `src/components/social-force-field/ZodiacDistribution.tsx` — bar chart
- `src/lib/zodiac.ts` — client-side sign + compatibility helpers
- `src/pages/InternalCoordination.tsx` — mount new panels
- `src/pages/MITWorkshop2026.tsx` / seating component — blend zodiac into pairing score + weight slider + re-evaluate button

### Open question
Any preference on the zodiac weight in the pairing score, or should I ship with 0.15 and let you tune it live?
