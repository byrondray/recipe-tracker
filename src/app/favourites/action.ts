'use server';

import { auth } from '@/auth';
import {
  category,
  favouriteRecipe,
  media,
  recipe as recipeSchema,
} from '@/db/schema/schema';
import { db } from '@/lib/db';
import { and, count, eq, inArray } from 'drizzle-orm';
import crypto from 'crypto';

export async function isRecipeFavourited(recipeId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: { favourited: false } };
    }

    const existing = await db
      .select()
      .from(favouriteRecipe)
      .where(
        and(
          eq(favouriteRecipe.userId, userId),
          eq(favouriteRecipe.recipeId, recipeId)
        )
      )
      .limit(1);

    return { success: { favourited: existing.length > 0 } };
  } catch (error) {
    console.error('Error checking favourite status:', error);
    return { error: 'Error checking favourite status' };
  }
}

export async function getFavouritedRecipeIds(recipeIds: string[]) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || recipeIds.length === 0) {
      return { success: { recipeIds: [] as string[] } };
    }

    const existing = await db
      .select({ recipeId: favouriteRecipe.recipeId })
      .from(favouriteRecipe)
      .where(
        and(
          eq(favouriteRecipe.userId, userId),
          inArray(favouriteRecipe.recipeId, recipeIds)
        )
      );

    return { success: { recipeIds: existing.map((r) => r.recipeId) } };
  } catch (error) {
    console.error('Error checking favourite status:', error);
    return { error: 'Error checking favourite status' };
  }
}

export async function toggleFavourite(recipeId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }
    const userId = session.user.id;

    const existing = await db
      .select()
      .from(favouriteRecipe)
      .where(
        and(
          eq(favouriteRecipe.userId, userId),
          eq(favouriteRecipe.recipeId, recipeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(favouriteRecipe)
        .where(eq(favouriteRecipe.id, existing[0].id));
      return { success: { favourited: false } };
    }

    // onConflictDoNothing means a concurrent double-click that already
    // inserted the row doesn't throw here — the recipe ends up favourited
    // either way, whichever request's insert actually landed.
    await db
      .insert(favouriteRecipe)
      .values({
        id: crypto.randomBytes(16).toString('hex'),
        userId,
        recipeId,
      })
      .onConflictDoNothing({
        target: [favouriteRecipe.userId, favouriteRecipe.recipeId],
      });

    return { success: { favourited: true } };
  } catch (error) {
    console.error('Error toggling favourite:', error);
    return { error: 'Error toggling favourite' };
  }
}

export async function getFavouriteCount(recipeId: string) {
  try {
    const [result] = await db
      .select({ total: count() })
      .from(favouriteRecipe)
      .where(eq(favouriteRecipe.recipeId, recipeId));

    return { success: { count: result?.total ?? 0 } };
  } catch (error) {
    console.error('Error getting favourite count:', error);
    return { error: 'Error getting favourite count' };
  }
}

export async function getFavouriteRecipes() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: 'No user ID found' };
    }

    const recipes = await db
      .select({
        recipe: recipeSchema,
        category,
        media,
      })
      .from(favouriteRecipe)
      .where(eq(favouriteRecipe.userId, userId))
      .innerJoin(recipeSchema, eq(favouriteRecipe.recipeId, recipeSchema.id))
      .innerJoin(category, eq(recipeSchema.category, category.id))
      .leftJoin(media, eq(recipeSchema.media, media.id));

    return { success: { recipes } };
  } catch (error) {
    console.error('Error getting favourite recipes:', error);
    return { error: 'Error getting favourite recipes' };
  }
}
