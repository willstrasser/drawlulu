export type TabooEntry = {
  word: string;
  relevancyScore: number;
};

export type WordCard = {
  objective: string;
  category: string;
  taboos: TabooEntry[];
};

export function isTabooEntry(v: unknown): v is TabooEntry {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).word === "string" &&
    typeof (v as Record<string, unknown>).relevancyScore === "number"
  );
}

export function isWordCard(v: unknown): v is WordCard {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.objective === "string" &&
    typeof c.category === "string" &&
    Array.isArray(c.taboos) &&
    c.taboos.every(isTabooEntry)
  );
}
