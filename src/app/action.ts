'use server';

import { category, media, recipe } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { eq, ilike, or } from 'drizzle-orm';

export async function getRecipes() {
  try {
    const recipes = await db
      .select()
      .from(recipe)
      .innerJoin(category, eq(recipe.category, category.id))
      .leftJoin(media, eq(recipe.media, media.id));

    return { success: { recipes } };
  } catch (error) {
    console.error('Error getting recipes:', error);
    return { error: 'Error getting recipes' };
  }
}

export async function filterRecipeByCategoryOrIngredient(userInput: string) {
  try {
    const filteredRecipes = await db
      .select()
      .from(recipe)
      .innerJoin(category, eq(recipe.category, category.id))
      .leftJoin(media, eq(recipe.media, media.id))
      .where(
        or(
          ilike(category.name, `%${userInput}%`),
          ilike(recipe.ingredients, `%${userInput}%`)
        )
      );

    console.log('filteredRecipes:', filteredRecipes);

    return { success: { recipes: filteredRecipes } };
  } catch (error) {
    console.error('Error filtering recipes:', error);
    return { error: 'Error filtering recipes' };
  }
}
