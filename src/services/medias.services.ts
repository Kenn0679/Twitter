import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIRECTORY } from '~/constants/dir';
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/File';
import fs from 'fs';
import { config } from 'dotenv';
import { isProduction } from '~/constants/config';
import { EncodingStatus, MediaType } from '~/constants/enums';
import { Media } from '~/models/Others';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import fsPromises from 'fs/promises';
import databaseService from './database.services';
import VideoStatusSchema from '~/models/Schemas/Video.Status.schema';
import { uploadFileToS3 } from '~/utils/s3';
import mime from 'mime';
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';

config();

class Queue {
  items: string[];
  encoding: boolean;
  constructor() {
    this.items = [];
    this.encoding = false;
  }
  enqueue(item: string) {
    this.items.push(item);
    const idName = getNameFromFullName(item.split('/').pop() as string);
    databaseService.videoStatus.insertOne(
      new VideoStatusSchema({
        name: idName,
        status: EncodingStatus.PENDING
      })
    );
    this.processEncode();
  }
  dequeue(): string | undefined {
    return this.items.shift();
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  async processEncode() {
    if (this.encoding) return;
    if (this.items.length === 0) return;
    this.encoding = true;
    const videoPath = this.items[0];
    const idName = getNameFromFullName(videoPath.split('/').pop() as string);
    try {
      databaseService.videoStatus.updateOne(
        { name: idName },
        {
          $set: {
            status: EncodingStatus.PROCESSING
          },
          $currentDate: {
            updated_at: true
          }
        }
      );
      await encodeHLSWithMultipleVideoStreams(videoPath);

      this.items.shift();
      await fsPromises.unlink(videoPath);
      databaseService.videoStatus.updateOne(
        { name: idName },
        {
          $set: {
            status: EncodingStatus.SUCCESSFULLY
          },
          $currentDate: {
            updated_at: true
          }
        }
      );
      console.log('success encoding');
    } catch (error) {
      databaseService.videoStatus
        .updateOne(
          { name: idName },
          {
            $set: {
              status: EncodingStatus.FAILED,
              message: (error as Error).message
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        .catch((err) => console.error('Error updating video status:', err));
      console.error('Error encoding video:', error);
    }
    this.encoding = false;
    this.processEncode();
  }
}

const queue = new Queue();

class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename);
        const newPath = path.resolve(UPLOAD_IMAGE_DIRECTORY, `${newName}.jpg`);

        await sharp(file.filepath).jpeg({ quality: 50 }).autoOrient().toFile(newPath);

        const resultS3 = await uploadFileToS3({
          fileName: `${newName}.jpg`,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        });

        await Promise.all([fsPromises.unlink(file.filepath), fsPromises.unlink(newPath)]);

        return {
          url: (resultS3 as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    return {
      url: isProduction
        ? `${process.env.HOST}/static/videos-stream/${files.newFilename}`
        : `${process.env.BASE_URL}/static/videos-stream/${files.newFilename}`,
      type: MediaType.Video
    };
  }

  async uploadHLSVideo(req: Request) {
    const files = await handleUploadVideo(req);

    const name = getNameFromFullName(files.newFilename);
    queue.enqueue(files.filepath);
    return {
      url: isProduction
        ? `${process.env.HOST}/static/videos-hls/${name}/master.m3u8`
        : `${process.env.BASE_URL}/static/videos-hls/${name}/master.m3u8`,
      type: MediaType.HLS
    };
  }
  async getVideoStatus(id: string) {
    const status = await databaseService.videoStatus.findOne({
      name: id
    });
    return status;
  }
}

const mediaService = new MediaService();
export default mediaService;
