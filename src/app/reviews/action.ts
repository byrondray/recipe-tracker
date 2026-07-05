'use server';

import { auth } from '@/auth';
import { review as reviewSchema, users } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { and, avg, count, desc, eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function getReviewsForRecipe(recipeId: string) {
  try {
    const reviews = await db
      .select({
        review: reviewSchema,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      })
      .from(reviewSchema)
      .where(eq(reviewSchema.recipeId, recipeId))
      .innerJoin(users, eq(reviewSchema.userId, users.id))
      .orderBy(desc(reviewSchema.createdAt));

    const [stats] = await db
      .select({
        average: avg(reviewSchema.rating),
        count: count(reviewSchema.id),
      })
      .from(reviewSchema)
      .where(eq(reviewSchema.recipeId, recipeId));

    return {
      success: {
        reviews,
        average: stats?.average ? Number(stats.average) : 0,
        count: stats?.count ?? 0,
      },
    };
  } catch (error) {
    console.error('Error getting reviews:', error);
    return { error: 'Error getting reviews' };
  }
}

export async function getCurrentUserReview(recipeId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: { review: null } };
    }

    const existing = await db
      .select()
      .from(reviewSchema)
      .where(
        and(eq(reviewSchema.userId, userId), eq(reviewSchema.recipeId, recipeId))
      )
      .limit(1);

    return { success: { review: existing[0] ?? null } };
  } catch (error) {
    console.error('Error getting current user review:', error);
    return { error: 'Error getting current user review' };
  }
}

export async function createReview(
  recipeId: string,
  rating: number,
  comment: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: 'Rating must be between 1 and 5' };
    }
    const userId = session.user.id;

    const existing = await db
      .select()
      .from(reviewSchema)
      .where(
        and(eq(reviewSchema.userId, userId), eq(reviewSchema.recipeId, recipeId))
      )
      .limit(1);

    if (existing.length > 0) {
      return { error: 'You have already reviewed this recipe' };
    }

    await db.insert(reviewSchema).values({
      id: crypto.randomBytes(16).toString('hex'),
      userId,
      recipeId,
      rating,
      comment: comment.trim() || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating review:', error);
    return { error: 'Error creating review' };
  }
}

export async function updateReview(
  reviewId: string,
  rating: number,
  comment: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: 'Rating must be between 1 and 5' };
    }

    const existing = await db
      .select()
      .from(reviewSchema)
      .where(eq(reviewSchema.id, reviewId))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Review not found' };
    }

    if (existing[0].userId !== session.user.id) {
      return { error: 'You are not authorized to edit this review.' };
    }

    await db
      .update(reviewSchema)
      .set({
        rating,
        comment: comment.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(reviewSchema.id, reviewId));

    return { success: true };
  } catch (error) {
    console.error('Error updating review:', error);
    return { error: 'Error updating review' };
  }
}

export async function deleteReview(reviewId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    const existing = await db
      .select()
      .from(reviewSchema)
      .where(eq(reviewSchema.id, reviewId))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Review not found' };
    }

    if (existing[0].userId !== session.user.id) {
      return { error: 'You are not authorized to delete this review.' };
    }

    await db.delete(reviewSchema).where(eq(reviewSchema.id, reviewId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { error: 'Error deleting review' };
  }
}
