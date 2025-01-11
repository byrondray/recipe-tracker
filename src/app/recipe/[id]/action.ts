'use server';

import { auth } from '@/auth';
import {
  category,
  db,
  media,
  recipe as recipeSchema,
} from '@/db/schema/schema';
import { eq } from 'drizzle-orm';

export async function getRecipe(id: string) {
  const recipe = await db
    .select({
      recipe: recipeSchema,
      category: category.name,
      imageUrl: media.url,
    })
    .from(recipeSchema)
    .where(eq(recipeSchema.id, id))
    .innerJoin(category, eq(recipeSchema.category, category.id))
    .leftJoin(media, eq(recipeSchema.media, media.id));

  return { success: { recipe } };
}

export async function getCurrentUserData() {
  const session = await auth();

  return { success: { session } };
}
