'use server';

import { category, media, recipe, review } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { and, avg, count, desc, eq, ilike, or, sql as drizzleSql } from 'drizzle-orm';
import { RESULTS_PER_PAGE } from './constants';

export type SortOption = 'newest' | 'oldest' | 'topRated';

interface GetRecipesOptions {
  page?: number;
  searchQuery?: string;
  categoryId?: string;
  minRating?: number;
  sort?: SortOption;
}

export async function getRecipes({
  page = 1,
  searchQuery = '',
  categoryId = '',
  minRating = 0,
  sort = 'newest',
}: GetRecipesOptions = {}) {
  try {
    const offset = (page - 1) * RESULTS_PER_PAGE;

    const conditions = [];
    if (searchQuery.trim() !== '') {
      conditions.push(
        or(
          ilike(category.name, `%${searchQuery}%`),
          ilike(recipe.ingredients, `%${searchQuery}%`)
        )
      );
    }
    if (categoryId) {
      conditions.push(eq(recipe.category, categoryId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const averageRating = avg(review.rating);
    const havingClause =
      minRating > 0 ? drizzleSql`${averageRating} >= ${minRating}` : undefined;

    const orderBy =
      sort === 'oldest'
        ? recipe.createdAt
        : sort === 'topRated'
        ? desc(averageRating)
        : desc(recipe.createdAt);

    const baseQuery = db
      .select({
        recipe,
        category,
        media,
        averageRating,
      })
      .from(recipe)
      .innerJoin(category, eq(recipe.category, category.id))
      .leftJoin(media, eq(recipe.media, media.id))
      .leftJoin(review, eq(review.recipeId, recipe.id))
      .groupBy(recipe.id, category.id, media.id);

    const filtered = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const withHaving = havingClause ? filtered.having(havingClause) : filtered;

    const recipes = await withHaving
      .orderBy(orderBy)
      .limit(RESULTS_PER_PAGE)
      .offset(offset);

    const totalCountQuery = db
      .select({ recipeId: recipe.id })
      .from(recipe)
      .innerJoin(category, eq(recipe.category, category.id))
      .leftJoin(review, eq(review.recipeId, recipe.id))
      .groupBy(recipe.id);

    const totalFiltered = whereClause
      ? totalCountQuery.where(whereClause)
      : totalCountQuery;
    const totalWithHaving = havingClause
      ? totalFiltered.having(havingClause)
      : totalFiltered;

    const totalRows = await totalWithHaving;

    return { success: { recipes, total: totalRows.length } };
  } catch (error) {
    console.error('Error getting recipes:', error);
    return { error: 'Error getting recipes' };
  }
}
