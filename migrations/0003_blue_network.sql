CREATE INDEX IF NOT EXISTS "media_userId_idx" ON "media" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipe_userId_idx" ON "recipe" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipe_category_idx" ON "recipe" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" USING btree ("userId");