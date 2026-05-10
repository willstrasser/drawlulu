import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { wordCards } from "@/lib/db/schema";
import { isWordCard, type WordCard } from "@/lib/cards";
import { log } from "@/lib/logger";

const client = new Anthropic();
const NUM_NEW_CARDS = 10;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const provided = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const providedBuf = Buffer.from(provided.padEnd(cronSecret.length));
  const secretBuf = Buffer.from(cronSecret.padEnd(provided.length));
  const match =
    provided.length === cronSecret.length &&
    timingSafeEqual(providedBuf, secretBuf);
  if (!match) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webSearchTool: Anthropic.Messages.WebSearchTool20250305 = {
    type: "web_search_20250305",
    name: "web_search",
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [webSearchTool],
    messages: [
      {
        role: "user",
        content: `Use web search to find ${NUM_NEW_CARDS} currently trending topics from news, entertainment, sports, or culture as of today.

For each topic, produce one word card in this exact JSON structure:
{
  "objective": "The target word or phrase players must draw",
  "category": "One of: Movies, TV Shows, Pop Singers, Sports, Current Events, Tech, Food & Drink, Places",
  "taboos": [
    { "word": "most obvious clue", "relevancyScore": 10 },
    { "word": "second clue", "relevancyScore": 9 },
    { "word": "third clue", "relevancyScore": 8 },
    { "word": "fourth clue", "relevancyScore": 7 },
    { "word": "fifth clue", "relevancyScore": 6 },
    { "word": "sixth clue", "relevancyScore": 5 },
    { "word": "seventh clue", "relevancyScore": 4 },
    { "word": "eighth clue", "relevancyScore": 3 }
  ]
}

Rules:
- The "objective" is something a person would draw (a person, movie, show, place, concept, etc.)
- Taboos are words players CANNOT say when describing the drawing — ordered from most obvious (score 10) to more obscure (score 3)
- Each taboo word/phrase should be a genuine hint someone might blurt out
- Your entire response must be ONLY a raw JSON array of ${NUM_NEW_CARDS} objects matching exactly the structure above — no markdown, no code fences, no explanation. It must be directly parseable by JSON.parse().`,
      },
    ],
  });

  // Extract the final text block containing the JSON
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "No text response from Claude" },
      { status: 500 },
    );
  }

  // Strip markdown code fences if present
  const raw = textBlock.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let cards: WordCard[];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isWordCard)) {
      return NextResponse.json(
        { error: "Response did not match WordCard[]" },
        { status: 500 },
      );
    }
    cards = parsed;
  } catch (error) {
    log.error("cron/generate-cards", "Failed to parse generated cards JSON", error);
    return NextResponse.json(
      { error: "Invalid JSON response from Claude" },
      { status: 500 },
    );
  }

  await db.insert(wordCards).values(
    cards.map((card) => ({
      objective: card.objective,
      category: card.category,
      taboos: card.taboos,
      source: "ai_generated" as const,
    })),
  );

  return NextResponse.json({ inserted: cards.length });
}
