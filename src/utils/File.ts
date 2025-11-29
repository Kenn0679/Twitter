import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { UPLOAD_IMAGE_DIRECTORY, UPLOAD_VIDEO_DIRECTORY } from '../constants/dir';
import path from 'path';
import { glob } from 'glob';

export const initFolder = () => {
  [UPLOAD_IMAGE_DIRECTORY, UPLOAD_VIDEO_DIRECTORY].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
  });
};

export const handleUploadImage = (req: Request) => {
  let invalidFile: Error | null = null;
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_DIRECTORY,
    maxFiles: 4,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalFileSize: 20 * 1024 * 1024, // 20MB
    filter: ({ name, mimetype }) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) invalidFile = new Error('Invalid file type');
      return valid;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (invalidFile) return reject(invalidFile);
      if (error) return reject(error);
      if (!files.image) return reject(new Error('File is empty'));

      const images = files.image as File[];

      images.forEach((image) => {
        const ext = getExtension(image.originalFilename || '');
        const newPath = `${image.filepath}.${ext}`;

        fs.renameSync(image.filepath, newPath);
        image.newFilename = `${image.newFilename}.${ext}`;
        image.filepath = newPath;
      });

      resolve(images);
    });
  });
};

export const handleUploadVideo = async (req: Request) => {
  let invalidFile: Error | null = null;

  const nanoId = (await import('nanoid')).nanoid;
  const idName = nanoId();
  const folderpath = path.resolve(UPLOAD_VIDEO_DIRECTORY, idName);
  fs.mkdirSync(folderpath, { recursive: true });

  const form = formidable({
    uploadDir: folderpath,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: ({ name, mimetype }) => {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'));
      if (!valid) invalidFile = new Error('Invalid file type');
      return valid;
    },
    filename: () => {
      return idName;
    }
  });

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (invalidFile) return reject(invalidFile);
      if (error) return reject(error);
      if (!files.video) return reject(new Error('File is empty'));

      const video = (files.video as File[])[0];

      const ext = getExtension(video.originalFilename || '');
      const newName = `${video.newFilename}.${ext}`;
      const newPath = `${video.filepath}.${ext}`;

      fs.renameSync(video.filepath, newPath);
      video.newFilename = newName;
      video.filepath = newPath;

      resolve(video);
    });
  });
};

export const getExtension = (fullName: string) => {
  return path.extname(fullName).replace('.', '').toLowerCase();
};

export const getNameFromFullName = (fullName: string) => {
  return path.basename(fullName, path.extname(fullName));
};

//only return files, no directories
export const getFiles = async (dir: string) => {
  const filesInDir = await glob('**/*', {
    cwd: dir,
    nodir: true,
    dot: true,
    absolute: true
  });

  return filesInDir;
};

//otherwise, if you don't want to use glob, you can use this function
/**
 *  
 * @param files
 *export const getFiles = async (dir: string): Promise<string[]> => {
  let results: string[] = [];
  const list = await fs.promises.readdir(dir, { withFileTypes: true });//return array of Dirent
  for (const dirent of list) {
    const fullPath = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(await getFiles(fullPath));//recursive
    } else {
      results.push(fullPath);//
    }
  }
  return results;
}; 
 * @returns 
 */

export const readFiles = async (files = []) => {
  const filesContent = await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf-8');
      return {
        file,
        content
      };
    })
  );
  return filesContent;
};
