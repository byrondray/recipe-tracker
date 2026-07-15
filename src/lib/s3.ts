import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { media as mediaSchema } from '@/db/schema/schema';

export const s3 = new S3Client({
  region: process.env.MY_AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.MY_AWS_SECRET_KEY!,
  },
});

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/jpg',
];

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Deletes the S3 object backing a media row, then the media row itself. */
export async function deleteMediaAndS3Object(mediaId: string) {
  const mediaToDelete = await db
    .select()
    .from(mediaSchema)
    .where(eq(mediaSchema.id, mediaId))
    .limit(1);

  if (mediaToDelete.length === 0) return;

  const mediaKey = mediaToDelete[0].url.split('/').pop();
  if (mediaKey) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.MY_AWS_BUCKET_NAME,
        Key: mediaKey,
      })
    );
  }

  await db.delete(mediaSchema).where(eq(mediaSchema.id, mediaId));
}
