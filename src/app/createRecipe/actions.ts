'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getSignedURL } from '@aws-sdk/s3-request-presigner';
import {
  category,
  InsertMedia,
  InsertRecipe,
  media,
  Media,
} from '@/db/schema/schema';
import { db } from '@/db/schema/schema';
import { recipe as recipeSchema } from '@/db/schema/schema';
import { auth } from '@/auth';
import crypto from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

const acceptedTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/jpg',
];

const maxFileSize = 1024 * 1024 * 10;

export const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

export const computeSha256 = async (base64Data: string): Promise<string> => {
  const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
};

export async function getSignedUrl(type: string, size: number) {
  const session = await auth();
  if (!session) return { error: 'Not authenticated' };

  if (!acceptedTypes.includes(type))
    return { error: 'You can only upload images.' };

  if (size > maxFileSize) return { error: 'File is too large.' };

  const fileName = generateFileName();

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: type,
    ContentLength: size,
    Metadata: {
      userId: session.userId,
    },
  });

  const signedUrl = await getSignedURL(s3, putObjectCommand, { expiresIn: 60 });
  return { success: { url: signedUrl, fileName: fileName } };
}

type InsertRecipeWithoutUserId = Omit<InsertRecipe, 'userId'>;

export async function createRecipe(recipe: InsertRecipeWithoutUserId) {
  try {
    const session = await auth();

    if (!recipe.steps) {
      return { error: 'Steps are required' };
    }

    if (!recipe.ingredients) {
      return { error: 'Ingredients are required' };
    }

    const result = await db
      .insert(recipeSchema)
      .values({ ...recipe, userId: session?.userId ?? '' })
      .returning();
    return { success: { recipe: result } };
  } catch (error) {
    console.error('Error creating recipe:', error);
    return { error: 'Error creating recipe' };
  }
}

type InsertMediaWithoutUserId = Omit<InsertMedia, 'userId'>;

export async function createMedia(m: InsertMediaWithoutUserId) {
  try {
    const session = await auth();
    const medias: Media = { ...m, userId: session?.userId ?? '' };
    const result = await db.insert(media).values(medias).returning();
    return { success: { media: result } };
  } catch (error) {
    console.error('Error creating media:', error);
    return { error: 'Error creating media' };
  }
}

export async function getCategories() {
  try {
    const categories = await db.select().from(category);
    return { success: { categories } };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { error: 'Error getting categories' };
  }
}
