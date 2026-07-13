// Compact LIWC-style category dictionary distilled from the appendix pages
// the admin uploaded. Deliberately shipped only inside the edge function so
// no browser bundle ever references category labels like "inhibition" or
// "anger" that could hint at the underlying instrumentation.
//
// Each category is a list of lowercase stems; a token is a hit if it starts
// with the stem. Categories used by the scoring pipeline are keyed exactly
// to the weight names in internal_research.interactional_config.

export type Category =
  | "posemo" | "negemo" | "anxiety" | "anger" | "sadness"
  | "cogproc" | "insight" | "causation" | "discrepancy" | "tentative" | "certainty"
  | "inhibition" | "incl" | "excl"
  | "social" | "family" | "friends" | "humans"
  | "negations" | "quantifiers" | "numbers"
  | "first_person_singular" | "first_person_plural" | "second_person" | "third_person"
  | "work" | "achievement" | "leisure" | "home" | "money" | "religion" | "death"
  | "assent" | "nonfluencies" | "fillers"
  | "body" | "health" | "sexual" | "ingest" | "motion" | "space" | "time";

export const DICT: Record<Category, string[]> = {
  posemo: ["love", "nice", "sweet", "happy", "joy", "great", "good", "kind", "care", "hope", "warm", "friend", "smile", "thank", "wonderful", "excellent", "pleas"],
  negemo: ["hurt", "ugly", "nasty", "bad", "hate", "awful", "terrible", "worse", "worst", "cruel"],
  anxiety: ["worr", "nervous", "afraid", "anxious", "fear", "stress", "tense", "panic"],
  anger: ["hate", "kill", "annoy", "angry", "mad", "furious", "rage", "irritat"],
  sadness: ["cry", "grief", "sad", "lonely", "depress", "sorrow", "mourn"],
  cogproc: ["cause", "know", "ought", "think", "understand", "consider", "reason", "because", "effect", "how"],
  insight: ["think", "know", "consider", "realize", "learn", "understand", "aware", "believe"],
  causation: ["because", "effect", "hence", "therefore", "cause", "reason", "consequence"],
  discrepancy: ["should", "would", "could", "wish", "expect", "want", "need", "must"],
  tentative: ["maybe", "perhaps", "guess", "possibly", "probably", "seem", "somewhat", "sort of"],
  certainty: ["always", "never", "certain", "definite", "sure", "clearly", "obvious", "truly"],
  inhibition: ["block", "constrain", "stop", "prevent", "avoid", "cautious", "hesitate"],
  incl: ["and", "with", "include", "also", "both", "together", "plus"],
  excl: ["but", "without", "exclude", "except", "however", "though", "although"],
  social: ["mate", "talk", "they", "child", "share", "team", "group", "collab", "colleague", "meet"],
  family: ["daughter", "husband", "son", "wife", "mother", "father", "family", "parent", "sister", "brother"],
  friends: ["buddy", "friend", "neighbor", "pal", "companion"],
  humans: ["adult", "baby", "boy", "girl", "human", "people", "person", "man", "woman"],
  negations: ["no", "not", "never", "none", "nothing", "cannot", "can't", "won't", "don't", "isn't"],
  quantifiers: ["few", "many", "much", "some", "several", "all", "most", "any", "every"],
  numbers: ["second", "thousand", "one", "two", "three", "four", "five", "hundred", "million"],
  first_person_singular: ["i", "me", "my", "mine", "myself", "i'm", "i've", "i'd", "i'll"],
  first_person_plural: ["we", "us", "our", "ours", "ourselves", "we're", "we've"],
  second_person: ["you", "your", "yours", "yourself", "you're", "you've"],
  third_person: ["he", "she", "her", "him", "his", "hers", "they", "their", "them"],
  work: ["job", "major", "career", "office", "work", "boss", "lab", "grant", "project", "study", "research", "science", "publish", "paper"],
  achievement: ["earn", "hero", "win", "success", "achieve", "accomplish", "goal", "reach"],
  leisure: ["cook", "chat", "movie", "game", "play", "party", "fun", "hobby"],
  home: ["apartment", "kitchen", "family", "house", "home", "room", "bedroom"],
  money: ["audit", "cash", "owe", "money", "dollar", "budget", "fund", "cost", "price", "pay"],
  religion: ["altar", "church", "mosque", "god", "pray", "spirit", "faith", "holy"],
  death: ["bury", "coffin", "kill", "death", "die", "dead", "grave", "funeral"],
  assent: ["agree", "ok", "yes", "yeah", "alright", "sure"],
  nonfluencies: ["er", "hm", "umm", "uh"],
  fillers: ["blah", "imean", "yaknow", "like", "basically", "actually"],
  body: ["cheek", "hand", "spit", "arm", "leg", "face", "eye", "brain", "heart", "skin"],
  health: ["clinic", "flu", "pill", "sick", "doctor", "medicine", "hospital", "disease", "patient"],
  sexual: ["horny", "love", "incest", "sex", "romantic"],
  ingest: ["dish", "eat", "pizza", "food", "drink", "meal", "hungry", "taste"],
  motion: ["arrive", "car", "go", "come", "run", "walk", "move", "travel"],
  space: ["down", "in", "thin", "up", "above", "below", "under", "over", "near"],
  time: ["end", "until", "season", "day", "week", "year", "hour", "minute", "today", "yesterday", "tomorrow"],
};

// Very small English stopword list for TF-IDF science vectors.
export const STOPWORDS = new Set([
  "a", "an", "and", "or", "but", "the", "of", "to", "in", "on", "at", "for",
  "with", "by", "as", "is", "are", "was", "were", "be", "been", "being",
  "this", "that", "these", "those", "it", "its", "we", "our", "they", "their",
  "will", "would", "can", "could", "should", "may", "might", "not", "no",
  "from", "into", "through", "during", "than", "then", "so", "such", "if",
  "which", "who", "whom", "what", "how", "when", "where", "why", "also",
  "has", "have", "had", "do", "does", "did", "one", "two", "three",
]);