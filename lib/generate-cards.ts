import Anthropic from "@anthropic-ai/sdk";
import { isWordCard, type WordCard } from "@/lib/cards";
import { log } from "@/lib/logger";

const client = new Anthropic();

const MIN_TABOOS = 5;
const MAX_CONTINUATIONS = 3;

export type GenerateCardsInput = {
  total: number;
  /** Category → how many cards it is short of the target. */
  deficits: Map<string, number>;
  /** Every category currently in the deck. */
  categories: string[];
  /** Objectives already in the deck (any state) — must not be repeated. */
  existingObjectives: string[];
};

export async function generateCards({
  total,
  deficits,
  categories,
  existingObjectives,
}: GenerateCardsInput): Promise<WordCard[]> {
  const shortList = [...deficits]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `- ${c}: needs ${n}`)
    .join("\n");

  const prompt = `You are refreshing the card deck for Drawlulu, a party game where one player writes a prompt for an AI image generator so the others can guess a target word, without using any of that card's taboo words.

Use web search to find what people are talking about right now (this week's news, releases, sports, memes, culture), and mix that with evergreen ideas that are fun to draw. Produce exactly ${total} new cards.

Categories in the deck: ${categories.join(", ")}.
${shortList ? `These categories are running low — prioritise them:\n${shortList}\n` : ""}
You may introduce at most one new category if a trending theme clearly deserves it; otherwise use the existing names exactly.

Never reuse any of these objectives (or trivial variants of them):
${existingObjectives.join("; ")}

Each card:
- "objective": a person, title, place, thing or concept most players would recognise and that can be depicted in an image. Avoid obscure niche picks and news that will be stale within a week.
- "category": a category name.
- "taboos": 8 entries, the words a player would most want to use, ordered from most obvious (relevancyScore 10) down to 3.

Reply with ONLY a raw JSON array of ${total} objects shaped like
{"objective": "...", "category": "...", "taboos": [{"word": "...", "relevancyScore": 10}, ...]}
with no markdown, code fences or commentary.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];
  let response: Anthropic.Message | undefined;

  // Server-side web search can pause long turns; resend to let it continue.
  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages,
    });
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }

  if (!response || response.stop_reason !== "end_turn") {
    throw new Error(`Generation stopped early: ${response?.stop_reason}`);
  }

  // With web search the reply is split across several text blocks around the
  // search results; the JSON array is in the text after the last search.
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) {
    throw new Error("No JSON array in generation response");
  }

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Generation was not an array");

  const cards = parsed.filter(
    (c): c is WordCard =>
      isWordCard(c) &&
      c.objective.trim() !== "" &&
      c.category.trim() !== "" &&
      c.taboos.length >= MIN_TABOOS,
  );
  if (cards.length < parsed.length) {
    log.warn("cron/refresh-cards", "Dropped malformed generated cards", {
      dropped: parsed.length - cards.length,
    });
  }
  return cards;
}
