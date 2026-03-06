CREATE INDEX "guesses_prompt_id_idx" ON "guesses" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "guesses_user_id_idx" ON "guesses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prompts_round_id_idx" ON "prompts" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "prompts_user_id_idx" ON "prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rounds_game_id_idx" ON "rounds" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "word_cards_is_active_category_idx" ON "word_cards" USING btree ("is_active","category");