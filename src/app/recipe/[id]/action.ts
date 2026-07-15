'use server';

import { auth } from '@/auth';
import { category, media, recipe as recipeSchema } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { deleteMediaAndS3Object } from '@/lib/s3';

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

export async function deleteRecipe(id: string) {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Not authenticated' };
    }

    const existing = await db
      .select()
      .from(recipeSchema)
      .where(eq(recipeSchema.id, id))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Recipe not found' };
    }

    if (existing[0].userId !== session.user.id) {
      return { error: 'You are not authorized to delete this recipe.' };
    }

    const mediaId = existing[0].media;

    if (mediaId) {
      await deleteMediaAndS3Object(mediaId);
    }

    await db.delete(recipeSchema).where(eq(recipeSchema.id, id));

    return { success: true };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return { error: 'Error deleting recipe' };
  }
}
