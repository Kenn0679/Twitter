import { Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGE_DIRECTORY } from '~/constants/dir';
import mediaService from '~/services/medias.services';

export const uploadSingleImageController = async (req: Request, res: Response) => {
  const url = await mediaService.handleUploadSingleImage(req);
  res.json({
    message: 'Upload image successfully',
    ...url
  });
};

export const serveImageController = (req: Request, res: Response) => {
  const { name } = req.params;

  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIRECTORY, name), (err: unknown) => {
    if (err) {
      const error = err as Error & { status: number };
      console.log(error);
      res.status(error.status).json({ error: error.message });
    }
  });
};
