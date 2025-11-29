import { GetObjectCommand, HeadObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { config } from 'dotenv';
import { Response } from 'express';
import fs from 'fs';

config();

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
});

export const uploadFileToS3 = async ({
  fileName,
  filePath,
  contentType
}: {
  fileName: string;
  filePath: string;
  contentType: string;
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: process.env.BUCKET_NAME as string,
      Key: fileName,
      Body: fs.readFileSync(filePath),
      ContentType: contentType
    },

    // optional tags
    tags: [
      /*...*/
    ],

    // additional optional fields show default values below:

    // (optional) concurrency configuration
    queueSize: 4,

    // (optional) size of each part, in bytes, at least 5MB
    partSize: 1024 * 1024 * 5,

    // (optional) when true, do not automatically call AbortMultipartUpload when
    // a multipart upload fails to complete. You should then manually handle
    // the leftover parts.
    leavePartsOnError: false
  });
  return parallelUploads3.done();
};

export const sendFileFromS3 = async (res: Response, filePath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: process.env.BUCKET_NAME as string,
      Key: filePath
    });
    (data.Body as any).pipe(res);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};
export const sendFileFromS3AsStream = async (res: Response, filePath: string, start: number) => {
  try {
    const CHUNK_SIZE = 5 * 10 ** 6; // 5MB

    const { ContentLength, ContentType } = await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.BUCKET_NAME as string,
        Key: filePath
      })
    );

    const end = Math.min(start + CHUNK_SIZE - 1, ContentLength! - 1);
    const contentLength = end - start + 1;

    const data = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: filePath,
        Range: `bytes=${start}-${end}`
      })
    );
    // Set headers for partial content and streaming with pipeline
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${ContentLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': ContentType || 'video/mp4'
    });
    (data.Body as any).pipe(res);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};
