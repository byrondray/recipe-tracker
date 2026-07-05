'use server';
import {
  recipe as recipeSchema,
  media as mediaSchema,
} from '@/db/schema/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { auth } from '@/auth';
import { getSignedUrl as getAWSsignedURL } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.MY_AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.MY_AWS_SECRET_KEY!,
  },
});

const acceptedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/jpg',
];

const maxFileSize = 5 * 1024 * 1024; // 5 MB

const getFileExtension = (url: string) => {
  const parts = url.split('.');
  return parts[parts.length - 1];
};

export async function getSignedUrlForExistingFile(
  type: string,
  size: number,
  fileName: string | null
) {
  const session = await auth();
  if (!session) return { error: 'Not authenticated' };

  if (!acceptedImageTypes.includes(type)) {
    return { error: 'You can only upload images.' };
  }

  if (size > maxFileSize) {
    return { error: 'File is too large.' };
  }

  const finalFileName = fileName;

  if (!finalFileName || typeof finalFileName !== 'string') {
    throw new Error('File name is invalid');
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
  mimeType: string | null
) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error('User is not authenticated.');
    }

    if (fileName === null || fileName.trim() === '') {
      throw new Error('FileName cannot be null or empty.');
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
    let url = null;

    if (fileName && mimeType) {
      url = `${process.env.NEXT_PUBLIC_AWS_BUCKET_URL}/${fileName}`;

      if (mediaId) {
        await db
          .update(mediaSchema)
          .set({ url, type: mimeType })
          .where(eq(mediaSchema.id, mediaId))
          .returning();
      } else {
        const existingMedia = await db
          .select()
          .from(mediaSchema)
          .where(eq(mediaSchema.id, fileName))
          .limit(1);

        if (
          existingMedia.length > 0 &&
          existingMedia[0].userId === session.user.id
        ) {
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
    } else if (!fileName && mediaId) {
      await db
        .update(recipeSchema)
        .set({ media: null })
        .where(eq(recipeSchema.id, id))
        .returning();

      await db.delete(mediaSchema).where(eq(mediaSchema.id, mediaId));
    }

    return { success: recipe };
  } catch (error) {
    console.error('Error during recipe update:', error);
    return { error: `Failed to update recipe: ${(error as Error).message}` };
  }
}

export async function deleteMedia(id: string) {
  try {
    const session = await auth();
    if (!session) {
      return { error: 'Not authenticated' };
    }

    const mediaToDelete = await db
      .select()
      .from(mediaSchema)
      .where(eq(mediaSchema.id, id))
      .limit(1);

    if (mediaToDelete.length === 0) {
      return { error: 'Media not found' };
    }

    if (mediaToDelete[0].userId !== session.user.id) {
      return { error: 'You are not authorized to delete this media.' };
    }

    const mediaUrl = mediaToDelete[0].url;
    const mediaKey = mediaUrl.split('/').pop();

    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: mediaKey!,
    });

    await s3.send(deleteObjectCommand);

    await db
      .update(recipeSchema)
      .set({ media: null })
      .where(eq(recipeSchema.media, mediaToDelete[0].id));

    await db.delete(mediaSchema).where(eq(mediaSchema.id, id));

    return { success: 'Your image has successfully been deleted' };
  } catch (error) {
    return { error: 'Error deleting media from database or S3' };
  }
}
