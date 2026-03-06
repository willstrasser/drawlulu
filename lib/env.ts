// Validates required environment variables at import time.
// Import this module in any server file that needs guaranteed env vars,
// or from the root layout to catch misconfigurations on the first request.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env file or Vercel project settings.`
    );
  }
  return value;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  SESSION_SECRET: requireEnv("SESSION_SECRET"),
  LIVEBLOCKS_SECRET_KEY: requireEnv("LIVEBLOCKS_SECRET_KEY"),
  FAL_KEY: requireEnv("FAL_KEY"),
  FLAGS_SECRET: requireEnv("FLAGS_SECRET"),
  CRON_SECRET: requireEnv("CRON_SECRET"),
} as const;
