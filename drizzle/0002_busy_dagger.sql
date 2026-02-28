ALTER TABLE "users" ALTER COLUMN "clerk_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauth_provider" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauth_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_oauth_id_unique" UNIQUE("oauth_id");