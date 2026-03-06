import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

type Card = {
  objective: string;
  category: string;
  taboos: { word: string; relevancyScore: number }[];
};

const cards: Card[] = [
  // ── Food & Drink ────────────────────────────────────────────────────────────
  {
    objective: "Sushi",
    category: "Food & Drink",
    taboos: [
      { word: "Japan", relevancyScore: 10 },
      { word: "raw fish", relevancyScore: 9 },
      { word: "rice", relevancyScore: 8 },
      { word: "seaweed", relevancyScore: 7 },
      { word: "chopsticks", relevancyScore: 6 },
      { word: "restaurant", relevancyScore: 5 },
      { word: "roll", relevancyScore: 4 },
      { word: "wasabi", relevancyScore: 3 },
    ],
  },
  {
    objective: "Pizza",
    category: "Food & Drink",
    taboos: [
      { word: "Italy", relevancyScore: 10 },
      { word: "cheese", relevancyScore: 9 },
      { word: "dough", relevancyScore: 8 },
      { word: "tomato sauce", relevancyScore: 7 },
      { word: "pepperoni", relevancyScore: 6 },
      { word: "oven", relevancyScore: 5 },
      { word: "slice", relevancyScore: 4 },
      { word: "delivery", relevancyScore: 3 },
    ],
  },
  {
    objective: "Avocado Toast",
    category: "Food & Drink",
    taboos: [
      { word: "brunch", relevancyScore: 10 },
      { word: "millennial", relevancyScore: 9 },
      { word: "avocado", relevancyScore: 8 },
      { word: "bread", relevancyScore: 7 },
      { word: "trendy", relevancyScore: 6 },
      { word: "cafe", relevancyScore: 5 },
      { word: "Instagram", relevancyScore: 4 },
      { word: "egg", relevancyScore: 3 },
    ],
  },
  {
    objective: "Espresso",
    category: "Food & Drink",
    taboos: [
      { word: "coffee", relevancyScore: 10 },
      { word: "Italy", relevancyScore: 9 },
      { word: "caffeine", relevancyScore: 8 },
      { word: "shot", relevancyScore: 7 },
      { word: "machine", relevancyScore: 6 },
      { word: "strong", relevancyScore: 5 },
      { word: "morning", relevancyScore: 4 },
      { word: "cup", relevancyScore: 3 },
    ],
  },
  {
    objective: "Ramen",
    category: "Food & Drink",
    taboos: [
      { word: "Japan", relevancyScore: 10 },
      { word: "noodles", relevancyScore: 9 },
      { word: "broth", relevancyScore: 8 },
      { word: "bowl", relevancyScore: 7 },
      { word: "pork", relevancyScore: 6 },
      { word: "egg", relevancyScore: 5 },
      { word: "soup", relevancyScore: 4 },
      { word: "chopsticks", relevancyScore: 3 },
    ],
  },
  {
    objective: "Taco",
    category: "Food & Drink",
    taboos: [
      { word: "Mexico", relevancyScore: 10 },
      { word: "tortilla", relevancyScore: 9 },
      { word: "salsa", relevancyScore: 8 },
      { word: "beef", relevancyScore: 7 },
      { word: "cheese", relevancyScore: 6 },
      { word: "Tuesday", relevancyScore: 5 },
      { word: "guacamole", relevancyScore: 4 },
      { word: "shell", relevancyScore: 3 },
    ],
  },
  {
    objective: "Cheeseburger",
    category: "Food & Drink",
    taboos: [
      { word: "McDonald's", relevancyScore: 10 },
      { word: "beef", relevancyScore: 9 },
      { word: "bun", relevancyScore: 8 },
      { word: "American", relevancyScore: 7 },
      { word: "grill", relevancyScore: 6 },
      { word: "fast food", relevancyScore: 5 },
      { word: "ketchup", relevancyScore: 4 },
      { word: "lettuce", relevancyScore: 3 },
    ],
  },
  {
    objective: "Croissant",
    category: "Food & Drink",
    taboos: [
      { word: "France", relevancyScore: 10 },
      { word: "pastry", relevancyScore: 9 },
      { word: "butter", relevancyScore: 8 },
      { word: "bakery", relevancyScore: 7 },
      { word: "flaky", relevancyScore: 6 },
      { word: "breakfast", relevancyScore: 5 },
      { word: "crescent", relevancyScore: 4 },
      { word: "café", relevancyScore: 3 },
    ],
  },
  {
    objective: "Margarita",
    category: "Food & Drink",
    taboos: [
      { word: "tequila", relevancyScore: 10 },
      { word: "cocktail", relevancyScore: 9 },
      { word: "lime", relevancyScore: 8 },
      { word: "salt rim", relevancyScore: 7 },
      { word: "Mexico", relevancyScore: 6 },
      { word: "drink", relevancyScore: 5 },
      { word: "blended", relevancyScore: 4 },
      { word: "glass", relevancyScore: 3 },
    ],
  },
  {
    objective: "Boba Tea",
    category: "Food & Drink",
    taboos: [
      { word: "Taiwan", relevancyScore: 10 },
      { word: "tapioca", relevancyScore: 9 },
      { word: "pearls", relevancyScore: 8 },
      { word: "milk tea", relevancyScore: 7 },
      { word: "straw", relevancyScore: 6 },
      { word: "trendy", relevancyScore: 5 },
      { word: "Asian", relevancyScore: 4 },
      { word: "drink", relevancyScore: 3 },
    ],
  },

  // ── Tech ────────────────────────────────────────────────────────────────────
  {
    objective: "iPhone",
    category: "Tech",
    taboos: [
      { word: "Apple", relevancyScore: 10 },
      { word: "smartphone", relevancyScore: 9 },
      { word: "Steve Jobs", relevancyScore: 8 },
      { word: "iOS", relevancyScore: 7 },
      { word: "touchscreen", relevancyScore: 6 },
      { word: "app", relevancyScore: 5 },
      { word: "camera", relevancyScore: 4 },
      { word: "silicon", relevancyScore: 3 },
    ],
  },
  {
    objective: "ChatGPT",
    category: "Tech",
    taboos: [
      { word: "AI", relevancyScore: 10 },
      { word: "OpenAI", relevancyScore: 9 },
      { word: "chatbot", relevancyScore: 8 },
      { word: "language model", relevancyScore: 7 },
      { word: "Sam Altman", relevancyScore: 6 },
      { word: "text", relevancyScore: 5 },
      { word: "conversation", relevancyScore: 4 },
      { word: "prompt", relevancyScore: 3 },
    ],
  },
  {
    objective: "TikTok",
    category: "Tech",
    taboos: [
      { word: "video", relevancyScore: 10 },
      { word: "viral", relevancyScore: 9 },
      { word: "China", relevancyScore: 8 },
      { word: "short-form", relevancyScore: 7 },
      { word: "dance", relevancyScore: 6 },
      { word: "ByteDance", relevancyScore: 5 },
      { word: "ban", relevancyScore: 4 },
      { word: "scrolling", relevancyScore: 3 },
    ],
  },
  {
    objective: "Tesla",
    category: "Tech",
    taboos: [
      { word: "electric", relevancyScore: 10 },
      { word: "Elon Musk", relevancyScore: 9 },
      { word: "car", relevancyScore: 8 },
      { word: "autopilot", relevancyScore: 7 },
      { word: "battery", relevancyScore: 6 },
      { word: "charging", relevancyScore: 5 },
      { word: "Model S", relevancyScore: 4 },
      { word: "silicon valley", relevancyScore: 3 },
    ],
  },
  {
    objective: "SpaceX",
    category: "Tech",
    taboos: [
      { word: "rocket", relevancyScore: 10 },
      { word: "Elon Musk", relevancyScore: 9 },
      { word: "Mars", relevancyScore: 8 },
      { word: "Falcon 9", relevancyScore: 7 },
      { word: "NASA", relevancyScore: 6 },
      { word: "launch", relevancyScore: 5 },
      { word: "space", relevancyScore: 4 },
      { word: "Starship", relevancyScore: 3 },
    ],
  },
  {
    objective: "Virtual Reality",
    category: "Tech",
    taboos: [
      { word: "headset", relevancyScore: 10 },
      { word: "Meta", relevancyScore: 9 },
      { word: "immersive", relevancyScore: 8 },
      { word: "gaming", relevancyScore: 7 },
      { word: "simulation", relevancyScore: 6 },
      { word: "goggles", relevancyScore: 5 },
      { word: "3D", relevancyScore: 4 },
      { word: "experience", relevancyScore: 3 },
    ],
  },
  {
    objective: "Bitcoin",
    category: "Tech",
    taboos: [
      { word: "cryptocurrency", relevancyScore: 10 },
      { word: "blockchain", relevancyScore: 9 },
      { word: "Satoshi", relevancyScore: 8 },
      { word: "wallet", relevancyScore: 7 },
      { word: "mining", relevancyScore: 6 },
      { word: "investment", relevancyScore: 5 },
      { word: "digital", relevancyScore: 4 },
      { word: "crash", relevancyScore: 3 },
    ],
  },
  {
    objective: "Airpods",
    category: "Tech",
    taboos: [
      { word: "Apple", relevancyScore: 10 },
      { word: "wireless", relevancyScore: 9 },
      { word: "earbuds", relevancyScore: 8 },
      { word: "Bluetooth", relevancyScore: 7 },
      { word: "music", relevancyScore: 6 },
      { word: "white", relevancyScore: 5 },
      { word: "charging case", relevancyScore: 4 },
      { word: "noise-canceling", relevancyScore: 3 },
    ],
  },

  // ── Movies (recent) ─────────────────────────────────────────────────────────
  {
    objective: "Barbie",
    category: "Movies",
    taboos: [
      { word: "Margot Robbie", relevancyScore: 10 },
      { word: "pink", relevancyScore: 9 },
      { word: "Greta Gerwig", relevancyScore: 8 },
      { word: "Ryan Gosling", relevancyScore: 7 },
      { word: "Mattel", relevancyScore: 6 },
      { word: "doll", relevancyScore: 5 },
      { word: "Kenough", relevancyScore: 4 },
      { word: "2023", relevancyScore: 3 },
    ],
  },
  {
    objective: "Oppenheimer",
    category: "Movies",
    taboos: [
      { word: "atomic bomb", relevancyScore: 10 },
      { word: "Cillian Murphy", relevancyScore: 9 },
      { word: "Christopher Nolan", relevancyScore: 8 },
      { word: "Manhattan Project", relevancyScore: 7 },
      { word: "nuclear", relevancyScore: 6 },
      { word: "World War II", relevancyScore: 5 },
      { word: "physicist", relevancyScore: 4 },
      { word: "2023", relevancyScore: 3 },
    ],
  },
  {
    objective: "Top Gun: Maverick",
    category: "Movies",
    taboos: [
      { word: "Tom Cruise", relevancyScore: 10 },
      { word: "fighter jets", relevancyScore: 9 },
      { word: "Navy", relevancyScore: 8 },
      { word: "sequel", relevancyScore: 7 },
      { word: "aviation", relevancyScore: 6 },
      { word: "Maverick", relevancyScore: 5 },
      { word: "Goose", relevancyScore: 4 },
      { word: "2022", relevancyScore: 3 },
    ],
  },
  {
    objective: "Everything Everywhere All at Once",
    category: "Movies",
    taboos: [
      { word: "multiverse", relevancyScore: 10 },
      { word: "Michelle Yeoh", relevancyScore: 9 },
      { word: "Oscar", relevancyScore: 8 },
      { word: "Daniels", relevancyScore: 7 },
      { word: "laundromat", relevancyScore: 6 },
      { word: "A24", relevancyScore: 5 },
      { word: "hot dog fingers", relevancyScore: 4 },
      { word: "2022", relevancyScore: 3 },
    ],
  },
  {
    objective: "Dune",
    category: "Movies",
    taboos: [
      { word: "spice", relevancyScore: 10 },
      { word: "desert", relevancyScore: 9 },
      { word: "Timothée Chalamet", relevancyScore: 8 },
      { word: "sandworm", relevancyScore: 7 },
      { word: "Denis Villeneuve", relevancyScore: 6 },
      { word: "sci-fi", relevancyScore: 5 },
      { word: "Arrakis", relevancyScore: 4 },
      { word: "Paul Atreides", relevancyScore: 3 },
    ],
  },

  // ── TV Shows (recent) ───────────────────────────────────────────────────────
  {
    objective: "The Bear",
    category: "TV Shows",
    taboos: [
      { word: "restaurant", relevancyScore: 10 },
      { word: "kitchen", relevancyScore: 9 },
      { word: "chef", relevancyScore: 8 },
      { word: "Chicago", relevancyScore: 7 },
      { word: "Carmy", relevancyScore: 6 },
      { word: "Hulu", relevancyScore: 5 },
      { word: "stress", relevancyScore: 4 },
      { word: "Emmy", relevancyScore: 3 },
    ],
  },
  {
    objective: "Succession",
    category: "TV Shows",
    taboos: [
      { word: "Roy family", relevancyScore: 10 },
      { word: "HBO", relevancyScore: 9 },
      { word: "media empire", relevancyScore: 8 },
      { word: "Logan Roy", relevancyScore: 7 },
      { word: "billionaire", relevancyScore: 6 },
      { word: "power", relevancyScore: 5 },
      { word: "satire", relevancyScore: 4 },
      { word: "Waystar", relevancyScore: 3 },
    ],
  },
  {
    objective: "The Last of Us",
    category: "TV Shows",
    taboos: [
      { word: "zombie", relevancyScore: 10 },
      { word: "Pedro Pascal", relevancyScore: 9 },
      { word: "HBO", relevancyScore: 8 },
      { word: "fungus", relevancyScore: 7 },
      { word: "post-apocalyptic", relevancyScore: 6 },
      { word: "video game", relevancyScore: 5 },
      { word: "Joel", relevancyScore: 4 },
      { word: "Ellie", relevancyScore: 3 },
    ],
  },
  {
    objective: "Squid Game",
    category: "TV Shows",
    taboos: [
      { word: "Korea", relevancyScore: 10 },
      { word: "survival", relevancyScore: 9 },
      { word: "Netflix", relevancyScore: 8 },
      { word: "green tracksuit", relevancyScore: 7 },
      { word: "children's games", relevancyScore: 6 },
      { word: "prize money", relevancyScore: 5 },
      { word: "Red Light Green Light", relevancyScore: 4 },
      { word: "doll", relevancyScore: 3 },
    ],
  },
  {
    objective: "House of the Dragon",
    category: "TV Shows",
    taboos: [
      { word: "Game of Thrones", relevancyScore: 10 },
      { word: "dragons", relevancyScore: 9 },
      { word: "HBO", relevancyScore: 8 },
      { word: "Targaryens", relevancyScore: 7 },
      { word: "prequel", relevancyScore: 6 },
      { word: "civil war", relevancyScore: 5 },
      { word: "Westeros", relevancyScore: 4 },
      { word: "fantasy", relevancyScore: 3 },
    ],
  },
  {
    objective: "White Lotus",
    category: "TV Shows",
    taboos: [
      { word: "resort", relevancyScore: 10 },
      { word: "HBO", relevancyScore: 9 },
      { word: "satire", relevancyScore: 8 },
      { word: "wealthy", relevancyScore: 7 },
      { word: "Hawaii", relevancyScore: 6 },
      { word: "murder mystery", relevancyScore: 5 },
      { word: "tourists", relevancyScore: 4 },
      { word: "drama", relevancyScore: 3 },
    ],
  },

  // ── Places ──────────────────────────────────────────────────────────────────
  {
    objective: "Times Square",
    category: "Places",
    taboos: [
      { word: "New York", relevancyScore: 10 },
      { word: "billboard", relevancyScore: 9 },
      { word: "New Year's Eve", relevancyScore: 8 },
      { word: "tourist", relevancyScore: 7 },
      { word: "Broadway", relevancyScore: 6 },
      { word: "neon signs", relevancyScore: 5 },
      { word: "Manhattan", relevancyScore: 4 },
      { word: "crowded", relevancyScore: 3 },
    ],
  },
  {
    objective: "Eiffel Tower",
    category: "Places",
    taboos: [
      { word: "Paris", relevancyScore: 10 },
      { word: "France", relevancyScore: 9 },
      { word: "iron", relevancyScore: 8 },
      { word: "landmark", relevancyScore: 7 },
      { word: "romantic", relevancyScore: 6 },
      { word: "Gustave", relevancyScore: 5 },
      { word: "tourist", relevancyScore: 4 },
      { word: "tall", relevancyScore: 3 },
    ],
  },
  {
    objective: "The Great Wall of China",
    category: "Places",
    taboos: [
      { word: "China", relevancyScore: 10 },
      { word: "ancient", relevancyScore: 9 },
      { word: "wall", relevancyScore: 8 },
      { word: "dynasty", relevancyScore: 7 },
      { word: "long", relevancyScore: 6 },
      { word: "soldiers", relevancyScore: 5 },
      { word: "landmark", relevancyScore: 4 },
      { word: "border", relevancyScore: 3 },
    ],
  },

  // ── Sports ──────────────────────────────────────────────────────────────────
  {
    objective: "Lionel Messi",
    category: "Sports",
    taboos: [
      { word: "soccer", relevancyScore: 10 },
      { word: "Argentina", relevancyScore: 9 },
      { word: "World Cup", relevancyScore: 8 },
      { word: "Barcelona", relevancyScore: 7 },
      { word: "Inter Miami", relevancyScore: 6 },
      { word: "GOAT", relevancyScore: 5 },
      { word: "Ballon d'Or", relevancyScore: 4 },
      { word: "dribble", relevancyScore: 3 },
    ],
  },
  {
    objective: "LeBron James",
    category: "Sports",
    taboos: [
      { word: "basketball", relevancyScore: 10 },
      { word: "Lakers", relevancyScore: 9 },
      { word: "NBA", relevancyScore: 8 },
      { word: "championship", relevancyScore: 7 },
      { word: "Cleveland", relevancyScore: 6 },
      { word: "King", relevancyScore: 5 },
      { word: "Miami Heat", relevancyScore: 4 },
      { word: "GOAT", relevancyScore: 3 },
    ],
  },
  {
    objective: "Wimbledon",
    category: "Sports",
    taboos: [
      { word: "tennis", relevancyScore: 10 },
      { word: "England", relevancyScore: 9 },
      { word: "grass court", relevancyScore: 8 },
      { word: "Grand Slam", relevancyScore: 7 },
      { word: "strawberries", relevancyScore: 6 },
      { word: "white", relevancyScore: 5 },
      { word: "tournament", relevancyScore: 4 },
      { word: "London", relevancyScore: 3 },
    ],
  },
];

async function main() {
  const existing = await db
    .select({
      objective: schema.wordCards.objective,
      category: schema.wordCards.category,
    })
    .from(schema.wordCards);

  const existingSet = new Set(
    existing.map((r) => `${r.objective}|${r.category}`),
  );

  const toInsert = cards.filter(
    (c) => !existingSet.has(`${c.objective}|${c.category}`),
  );

  if (toInsert.length === 0) {
    console.log(
      `All ${cards.length} cards already exist in the database. Nothing to insert.`,
    );
    return;
  }

  await db.insert(schema.wordCards).values(
    toInsert.map((c) => ({
      objective: c.objective,
      category: c.category,
      taboos: c.taboos,
      source: "system" as const,
    })),
  );

  console.log(
    `Inserted ${toInsert.length} new cards. Skipped ${cards.length - toInsert.length} already existing.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
