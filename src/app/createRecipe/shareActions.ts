'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  extractRecipeFromUrl,
  ExtractRecipeError,
  ExtractRecipeFailureReason,
} from '@/lib/recipeExtractor';
import { safeFetch, UnsafeUrlError } from '@/lib/safeFetch';
import { auth } from '@/auth';
import { s3, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from '@/lib/s3';
import { generateFileName, createMedia } from './actions';

export async function extractRecipeFromUrlAction(url: string) {
  try {
    const recipe = await extractRecipeFromUrl(url);
    return { success: { recipe } };
  } catch (error) {
    if (error instanceof ExtractRecipeError) {
      return { error: error.message, reason: error.reason };
    }
    console.error('Error extracting recipe from URL:', error);
    return {
      error: 'Failed to fetch shared page.',
      reason: 'unreachable' as ExtractRecipeFailureReason,
    };
  }
}

export async function uploadRemoteImageToS3(remoteUrl: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  let res: Response;
  try {
    res = await safeFetch(remoteUrl, { signal: AbortSignal.timeout(10000) });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return { error: error.message };
    }
    return { error: 'Could not download the shared image.' };
  }
  if (!res.ok) return { error: 'Could not download the shared image.' };

  const contentType = (res.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!ACCEPTED_IMAGE_TYPES.includes(contentType)) {
    return { error: 'Shared image is not a supported format.' };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_FILE_SIZE) {
    return { error: 'Shared image is too large.' };
  }

  const fileName = await generateFileName();
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      Metadata: { userId: session.user.id },
    })
  );

  const urlAWS = `${process.env.NEXT_PUBLIC_AWS_BUCKET_URL}/${fileName}`;
  return createMedia({
    id: fileName,
    url: urlAWS,
    type: contentType,
    createdAt: new Date(),
  });
}
