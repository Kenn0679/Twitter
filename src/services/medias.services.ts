import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIRECTORY } from '~/constants/dir';
import { getNameFromFullName, handleUploadSingleImage } from '~/utils/File';
import fs from 'fs';
import { config } from 'dotenv';
import { isProduction } from '~/constants/config';

config();

class MediaService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req);

    const newName = getNameFromFullName(file.newFilename);
    const newPath = path.resolve(UPLOAD_IMAGE_DIRECTORY, `${newName}.jpg`);
    await sharp(file.filepath).jpeg({ quality: 50 }).autoOrient().toFile(newPath);
    fs.unlinkSync(file.filepath);

    return {
      url: isProduction
        ? `${process.env.HOST}/static/images/${newName}.jpg`
        : `${process.env.BASE_URL}/static/images/${newName}.jpg`
    };
  }
}

const mediaService = new MediaService();
export default mediaService;
