import { S3Client } from '@aws-sdk/client-s3';

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
  'image/svg+xml',
  'image/jpg',
];

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
