export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export const ZODIAC_GLYPH: Record<ZodiacSign, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

export const ZODIAC_ELEMENT: Record<ZodiacSign, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

/** Derive zodiac sign from an ISO date string (YYYY-MM-DD). Mirrors the DB function. */
export function deriveZodiac(birthday: string | null | undefined): ZodiacSign | null {
  if (!birthday) return null;
  const [_, m, d] = birthday.split("-").map(Number);
  if (!m || !d) return null;
  const md = m * 100 + d;
  if (md >= 321 && md <= 419) return "Aries";
  if (md >= 420 && md <= 520) return "Taurus";
  if (md >= 521 && md <= 620) return "Gemini";
  if (md >= 621 && md <= 722) return "Cancer";
  if (md >= 723 && md <= 822) return "Leo";
  if (md >= 823 && md <= 922) return "Virgo";
  if (md >= 923 && md <= 1022) return "Libra";
  if (md >= 1023 && md <= 1121) return "Scorpio";
  if (md >= 1122 && md <= 1221) return "Sagittarius";
  if (md >= 1222 || md <= 119) return "Capricorn";
  if (md >= 120 && md <= 218) return "Aquarius";
  return "Pisces";
}

/** Compatibility between two signs on [0, 1]. Same element = 1, complementary = 0.5, else 0. */
export function zodiacCompatibility(a: ZodiacSign | null | undefined, b: ZodiacSign | null | undefined): number {
  if (!a || !b) return 0;
  const ea = ZODIAC_ELEMENT[a];
  const eb = ZODIAC_ELEMENT[b];
  if (ea === eb) return 1;
  const complementary =
    (ea === "Fire" && eb === "Air") || (ea === "Air" && eb === "Fire") ||
    (ea === "Earth" && eb === "Water") || (ea === "Water" && eb === "Earth");
  return complementary ? 0.5 : 0;
}