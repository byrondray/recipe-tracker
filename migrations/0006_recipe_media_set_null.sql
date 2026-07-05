ALTER TABLE "recipe" DROP CONSTRAINT "recipe_media_media_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe" ADD CONSTRAINT "recipe_media_media_id_fk" FOREIGN KEY ("media") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
