import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIRECTORY, UPLOAD_VIDEO_DIRECTORY } from '~/constants/dir';
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/File';
import fs from 'fs';
import { config } from 'dotenv';
import { isProduction } from '~/constants/config';
import { MediaType } from '~/constants/enums';
import { Media } from '~/models/Others';

config();

class MediaService {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename);
        const newPath = path.resolve(UPLOAD_IMAGE_DIRECTORY, `${newName}.jpg`);
        console.log(file.filepath);
        await sharp(file.filepath).jpeg({ quality: 50 }).autoOrient().toFile(newPath);
        fs.unlinkSync(file.filepath);
        return {
          url: isProduction
            ? `${process.env.HOST}/static/images/${newName}.jpg`
            : `${process.env.BASE_URL}/static/images/${newName}.jpg`,
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
        ? `${process.env.HOST}/static/videos/${files.newFilename}`
        : `${process.env.BASE_URL}/static/videos/${files.newFilename}`,
      type: MediaType.Video
    };
  }
}

const mediaService = new MediaService();
export default mediaService;
