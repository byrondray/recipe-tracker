CREATE TABLE IF NOT EXISTS "favouriteRecipe" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"recipeId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"recipeId" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favouriteRecipe" ADD CONSTRAINT "favouriteRecipe_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favouriteRecipe" ADD CONSTRAINT "favouriteRecipe_recipeId_recipe_id_fk" FOREIGN KEY ("recipeId") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review" ADD CONSTRAINT "review_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review" ADD CONSTRAINT "review_recipeId_recipe_id_fk" FOREIGN KEY ("recipeId") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favouriteRecipe_userId_idx" ON "favouriteRecipe" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favouriteRecipe_recipeId_idx" ON "favouriteRecipe" USING btree ("recipeId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "favouriteRecipe_userId_recipeId_idx" ON "favouriteRecipe" USING btree ("userId","recipeId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_userId_idx" ON "review" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_recipeId_idx" ON "review" USING btree ("recipeId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "review_userId_recipeId_idx" ON "review" USING btree ("userId","recipeId");