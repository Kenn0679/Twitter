import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';

import { UPLOAD_IMAGE_DIRECTORY, UPLOAD_TEMP_DIRECTORY } from '../constants/dir';

export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_IMAGE_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_IMAGE_DIRECTORY, {
      recursive: true
    });
  }
  if (!fs.existsSync(UPLOAD_TEMP_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_TEMP_DIRECTORY, {
      recursive: true
    });
  }
};

export const handleUploadSingleImage = (req: Request) => {
  let invalidFile: Error | null;
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIRECTORY,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filter: ({ name, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
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

      if (!files.image) {
        reject(new Error('File is empty'));
      }
      resolve((files.image as File[])[0]);
    });
  });
};

export const getNameFromFullName = (fullName: string) => {
  const nameParts = fullName.split('.');
  nameParts.pop();
  return nameParts.join('');
};
