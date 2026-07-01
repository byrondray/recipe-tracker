'use server';

import { auth } from '@/auth';
import { category, media, recipe as recipeSchema } from '@/db/schema/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.MY_AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.MY_AWS_SECRET_KEY!,
  },
});

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

    await db.delete(recipeSchema).where(eq(recipeSchema.id, id));

    if (mediaId) {
      const mediaToDelete = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .limit(1);

      if (mediaToDelete.length > 0) {
        const mediaKey = mediaToDelete[0].url.split('/').pop();

        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.MY_AWS_BUCKET_NAME,
            Key: mediaKey!,
          })
        );

        await db.delete(media).where(eq(media.id, mediaId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return { error: 'Error deleting recipe' };
  }
}
