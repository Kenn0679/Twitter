import e, { Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGE_DIRECTORY, UPLOAD_VIDEO_DIRECTORY } from '~/constants/dir';
import mediaService from '~/services/medias.services';

export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediaService.handleUploadImage(req);
  res.json({
    message: 'Upload image successfully',
    ...url
  });
};

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params;

  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIRECTORY, name), (err: unknown) => {
    if (err) {
      const error = err as Error & { status?: number };
      console.log(error);
      res.status(error.status || 404).json({ error: error.message || 'Image not found' });
    }
  });
};

export const serveVideosController = (req: Request, res: Response) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIRECTORY, name), (err: unknown) => {
    if (err) {
      const error = err as Error & { status?: number };
      console.log(error);
      res.status(error.status || 404).json({ error: error.message || 'Video not found' });
    }
  });
};

export const uploadVideoController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadVideo(req);
  res.json({
    message: 'Upload video successfully',
    ...url
  });
};
