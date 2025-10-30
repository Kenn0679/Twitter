import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';

import { UPLOAD_IMAGE_DIRECTORY, UPLOAD_TEMP_DIRECTORY, UPLOAD_VIDEO_DIRECTORY } from '../constants/dir';
import { get } from 'lodash';

export const initFolder = () => {
  [UPLOAD_IMAGE_DIRECTORY, UPLOAD_TEMP_DIRECTORY, UPLOAD_VIDEO_DIRECTORY].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
  });
};

export const handleUploadImage = (req: Request) => {
  let invalidFile: Error | null;
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIRECTORY,
    maxFiles: 4,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalFileSize: 20 * 1024 * 1024, // 20MB
    filter: ({ name, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) {
        invalidFile = new Error('Invalid file type');
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (invalidFile) {
        return reject(invalidFile);
      }

      if (error) {
        reject(error);
      }

      if (!files.image) {
        reject(new Error('File is empty'));
      }

      const images = files.image as File[];
      images.forEach((image) => {
        const extension = getExtension(image.originalFilename as string);
        fs.renameSync(image.filepath, `${image.filepath}.${extension}`);
      });
      resolve(images);
    });
  });
};

export const handleUploadVideo = (req: Request) => {
  let invalidFile: Error | null;
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIRECTORY,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: ({ name, mimetype }) => {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'));
      if (!valid) {
        invalidFile = new Error('Invalid file type');
      }
      return valid;
    }
  });
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (invalidFile) {
        return reject(invalidFile);
      }

      if (error) {
        reject(error);
      }

      if (!files.video) {
        reject(new Error('File is empty'));
      }

      const video = (files.video as File[])[0];
      const extension = getExtension(video.originalFilename as string);
      const newName = video.newFilename;

      video.newFilename = `${newName}.${extension}`;
      const newPath = `${video.filepath}.${extension}`;

      fs.renameSync(video.filepath, newPath);
      video.filepath = newPath;

      resolve(video);
    });
  });
};

export const getNameFromFullName = (fullName: string) => {
  const nameParts = fullName.split('.');
  nameParts.pop();
  return nameParts.join('');
};

export const getExtension = (fullName: string) => {
  const nameParts = fullName.split('.');
  return nameParts.pop() as string;
};
