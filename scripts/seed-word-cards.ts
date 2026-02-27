import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { terms } from "../lib/words";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const rows = terms.flatMap((group) =>
    group.cards.map((card) => ({
      objective: card.objective,
      category: group.category,
      taboos: card.taboos.map((word) => ({ word, relevancyScore: 10 })),
      source: "system" as const,
    }))
  );

  await db.insert(schema.wordCards).values(rows).onConflictDoNothing();
  console.log(`Seeded ${rows.length} word cards.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
