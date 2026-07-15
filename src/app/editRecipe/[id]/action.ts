'use server';
import {
  recipe as recipeSchema,
  media as mediaSchema,
} from '@/db/schema/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/auth';
import { getSignedUrl as getAWSsignedURL } from '@aws-sdk/s3-request-presigner';
import {
  s3,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_FILE_SIZE,
  deleteMediaAndS3Object,
} from '@/lib/s3';

export async function getSignedUrlForExistingFile(
  type: string,
  size: number,
  fileName: string | null
) {
  const session = await auth();
  if (!session) return { error: 'Not authenticated' };

  if (!ACCEPTED_IMAGE_TYPES.includes(type)) {
    return { error: 'You can only upload images.' };
  }

  if (size > MAX_IMAGE_FILE_SIZE) {
    return { error: 'File is too large.' };
  }

  const finalFileName = fileName;

  if (!finalFileName || typeof finalFileName !== 'string') {
    return { error: 'File name is invalid' };
  }

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.MY_AWS_BUCKET_NAME,
    Key: finalFileName,
    ContentType: type,
    ContentLength: size,
    Metadata: {
      userId: session.user.id,
    },
  });

  const signedUrl = await getAWSsignedURL(s3, putObjectCommand, {
    expiresIn: 60,
  });

  return { success: { url: signedUrl, fileName: finalFileName } };
}

export async function updateRecipe(
  id: string,
  title: string,
  steps: string,
  ingredients: string,
  category: string,
  fileName: string | null,
  mimeType: string | null,
  removeMedia: boolean = false
) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error('User is not authenticated.');
    }

    const existingRecipe = await db
      .select()
      .from(recipeSchema)
      .where(eq(recipeSchema.id, id))
      .limit(1);

    if (existingRecipe.length === 0) {
      throw new Error('Recipe not found.');
    }

    if (session.user.id !== existingRecipe[0].userId) {
      throw new Error('You are not authorized to update this recipe.');
    }

    const recipe = await db
      .update(recipeSchema)
      .set({ title, ingredients, category, steps, updatedAt: new Date() })
      .where(eq(recipeSchema.id, id))
      .returning();

    const mediaId = recipe[0].media;

    if (fileName && mimeType) {
      const url = `${process.env.NEXT_PUBLIC_AWS_BUCKET_URL}/${fileName}`;

      if (mediaId) {
        const oldMedia = await db
          .select()
          .from(mediaSchema)
          .where(eq(mediaSchema.id, mediaId))
          .limit(1);
        const oldMediaKey = oldMedia[0]?.url.split('/').pop();

        await db
          .update(mediaSchema)
          .set({ url, type: mimeType })
          .where(eq(mediaSchema.id, mediaId))
          .returning();

        if (oldMediaKey && oldMediaKey !== fileName) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.MY_AWS_BUCKET_NAME,
              Key: oldMediaKey,
            })
          );
        }
      } else {
        const existingMedia = await db
          .select()
          .from(mediaSchema)
          .where(eq(mediaSchema.id, fileName))
          .limit(1);

        if (existingMedia.length > 0) {
          if (existingMedia[0].userId !== session.user.id) {
            throw new Error('You are not authorized to use this file.');
          }

          await db
            .update(recipeSchema)
            .set({ media: existingMedia[0].id })
            .where(eq(recipeSchema.id, id))
            .returning();
        } else {
          const newMedia = await db
            .insert(mediaSchema)
            .values({
              id: fileName,
              url,
              type: mimeType,
              userId: recipe[0].userId,
              createdAt: new Date(),
            })
            .returning();

          await db
            .update(recipeSchema)
            .set({ media: newMedia[0].id })
            .where(eq(recipeSchema.id, id))
            .returning();
        }
      }
    } else if (removeMedia && mediaId) {
      await db
        .update(recipeSchema)
        .set({ media: null })
        .where(eq(recipeSchema.id, id))
        .returning();

      await deleteMediaAndS3Object(mediaId);
    }

    return { success: recipe };
  } catch (error) {
    console.error('Error during recipe update:', error);
    return { error: `Failed to update recipe: ${(error as Error).message}` };
  }
}

