import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIRECTORY } from '~/constants/dir';
import { getNameFromFullName, handleUploadSingleImage } from '~/utils/File';
import fs from 'fs';
import { config } from 'dotenv';

config();

class MediaService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req);

    const newName = getNameFromFullName(file.newFilename);
    const newPath = path.resolve(UPLOAD_IMAGE_DIRECTORY, `${newName}.jpg`);
    await sharp(file.filepath).jpeg({ quality: 50 }).autoOrient().toFile(newPath);
    fs.unlinkSync(file.filepath);

    return {
      message: 'Upload image successfully',
      result: {
        name: `${newName}.jpg`,
        url: `${process.env.BASE_URL}/uploads/${newName}.jpg`
      }
    };
  }
}

const mediaService = new MediaService();
export default mediaService;
