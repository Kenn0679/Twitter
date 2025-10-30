import { Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGE_DIRECTORY, UPLOAD_VIDEO_DIRECTORY } from '~/constants/dir';
import HTTP_STATUS from '~/constants/httpStatus';
import mediaService from '~/services/medias.services';
import fs from 'fs';
import mime from 'mime';

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

export const serveVideosStreamController = (req: Request, res: Response) => {
  const range = req.headers.range;

  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header');
  }

  const { name } = req.params;
  const videoPath = path.resolve(UPLOAD_VIDEO_DIRECTORY, name);

  // Kiểm tra file tồn tại
  if (!fs.existsSync(videoPath)) {
    return res.status(HTTP_STATUS.NOT_FOUND).send('Video not found');
  }

  // 1MB = 10^6 bytes (hệ thập phân), hoặc 2^20 bytes = 1,048,576 bytes (hệ nhị phân)
  const videoSize = fs.statSync(videoPath).size;
  const CHUNK_SIZE = 10 ** 6; // 1MB

  // Parse range header: "bytes=1000-2000" hoặc "bytes=1000-"
  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  // Bắt buộc mỗi response tối đa 1MB
  const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);

  // contentLength phải +1 vì range inclusive (từ start đến end, bao gồm cả 2 đầu)
  const contentLength = end - start + 1;
  const contentType = mime.getType(videoPath) || 'video/mp4';

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  };
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers);

  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
};

export const uploadVideoController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadVideo(req);
  res.json({
    message: 'Upload video successfully',
    ...url
  });
};
