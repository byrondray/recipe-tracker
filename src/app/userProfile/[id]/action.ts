'use server';

import { auth } from '@/auth';
import { recipe, users, media, category } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function getRecipesForUser() {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return { error: 'No user ID found' };
    }

    const recipes = await db
      .select()
      .from(recipe)
      .where(eq(recipe.userId, userId))
      .innerJoin(category, eq(recipe.category, category.id))
      .leftJoin(media, eq(recipe.media, media.id));

    return { success: { recipes } };
  } catch (error) {
    console.error('Error getting recipes:', error);
    return { error: 'Error getting recipes' };
  }
}

export async function getUserData() {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return { error: 'No user ID found' };
    }

    const user = await db.select().from(users).where(eq(users.id, userId));
    return { success: { user } };
  } catch (error) {
    console.error('Error getting user data:', error);
    return { error: 'Error getting user data' };
  }
}
