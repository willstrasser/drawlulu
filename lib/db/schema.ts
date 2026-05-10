import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique(),
  username: text("username").notNull(),
  imageUrl: text("image_url"),
  oauthProvider: text("oauth_provider"),
  oauthId: text("oauth_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomCode: text("room_code").notNull().unique(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id),
  status: text("status", {
    enum: ["lobby", "active", "finished"] as const,
  })
    .notNull()
    .default("lobby"),
  currentRoundId: uuid("current_round_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rounds = pgTable(
  "rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    roundNumber: integer("round_number").notNull(),
    status: text("status", {
      enum: [
        "prompting",
        "generating",
        "guessing",
        "scoreboard",
        "completed",
      ] as const,
    })
      .notNull()
      .default("prompting"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("rounds_game_id_idx").on(table.gameId)],
);

export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => rounds.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    targetWord: text("target_word").notNull(),
    tabooWords: text("taboo_words").array().notNull(),
    originalPrompt: text("original_prompt"),
    sanitizedPrompt: text("sanitized_prompt"),
    imageUrl: text("image_url"),
    forbiddenWordsUsed: text("forbidden_words_used").array().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompts_round_id_idx").on(table.roundId),
    index("prompts_user_id_idx").on(table.userId),
  ],
);

export const wordCards = pgTable(
  "word_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objective: text("objective").notNull(),
    category: text("category").notNull(),
    taboos: jsonb("taboos")
      .notNull()
      .$type<Array<{ word: string; relevancyScore: number }>>(),
    // relevancyScore: 1–10. 10 = most obvious hint; 1 = obscure/tangential.
    // Stored for future difficulty modulation — not yet used in gameplay.
    authorId: uuid("author_id").references(() => users.id),
    source: text("source", {
      enum: ["system", "ai_generated", "user"] as const,
    })
      .notNull()
      .default("system"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("word_cards_is_active_category_idx").on(
      table.isActive,
      table.category,
    ),
  ],
);

export const guesses = pgTable(
  "guesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    guessText: text("guess_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    guessedAt: timestamp("guessed_at").defaultNow().notNull(),
  },
  (table) => [
    index("guesses_prompt_id_idx").on(table.promptId),
    index("guesses_user_id_idx").on(table.userId),
  ],
);
