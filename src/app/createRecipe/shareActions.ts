'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extractRecipeFromUrl } from '@/lib/recipeExtractor';
import { auth } from '@/auth';
import { generateFileName, createMedia } from './actions';

const s3 = new S3Client({
  region: process.env.MY_AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.MY_AWS_SECRET_KEY!,
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

export async function extractRecipeFromUrlAction(url: string) {
  try {
    const recipe = await extractRecipeFromUrl(url);
    if (!recipe) return { error: 'No structured recipe data found.' };
    return { success: { recipe } };
  } catch (error) {
    console.error('Error extracting recipe from URL:', error);
    return { error: 'Failed to fetch shared page.' };
  }
}

export async function uploadRemoteImageToS3(remoteUrl: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not authenticated' };

  let res: Response;
  try {
    res = await fetch(remoteUrl, { signal: AbortSignal.timeout(10000) });
  } catch {
    return { error: 'Could not download the shared image.' };
  }
  if (!res.ok) return { error: 'Could not download the shared image.' };

  const contentType = (res.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!acceptedTypes.includes(contentType)) {
    return { error: 'Shared image is not a supported format.' };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > maxFileSize) {
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
