'use server';

import { category, media, recipe } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { count, eq, ilike, or } from 'drizzle-orm';

export const RESULTS_PER_PAGE = 16;

export async function getRecipes(page = 1) {
  try {
    const offset = (page - 1) * RESULTS_PER_PAGE;

    const [recipes, [{ total }]] = await Promise.all([
      db
        .select()
        .from(recipe)
        .innerJoin(category, eq(recipe.category, category.id))
        .leftJoin(media, eq(recipe.media, media.id))
        .limit(RESULTS_PER_PAGE)
        .offset(offset),
      db.select({ total: count() }).from(recipe),
    ]);

    return { success: { recipes, total } };
  } catch (error) {
    console.error('Error getting recipes:', error);
    return { error: 'Error getting recipes' };
  }
}

export async function filterRecipeByCategoryOrIngredient(
  userInput: string,
  page = 1
) {
  try {
    const offset = (page - 1) * RESULTS_PER_PAGE;
    const whereClause = or(
      ilike(category.name, `%${userInput}%`),
      ilike(recipe.ingredients, `%${userInput}%`)
    );

    const [filteredRecipes, [{ total }]] = await Promise.all([
      db
        .select()
        .from(recipe)
        .innerJoin(category, eq(recipe.category, category.id))
        .leftJoin(media, eq(recipe.media, media.id))
        .where(whereClause)
        .limit(RESULTS_PER_PAGE)
        .offset(offset),
      db
        .select({ total: count() })
        .from(recipe)
        .innerJoin(category, eq(recipe.category, category.id))
        .where(whereClause),
    ]);

    return { success: { recipes: filteredRecipes, total } };
  } catch (error) {
    console.error('Error filtering recipes:', error);
    return { error: 'Error filtering recipes' };
  }
}
