import { Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGE_DIRECTORY } from '~/constants/dir';
import HTTP_STATUS from '~/constants/httpStatus';
import mediaService from '~/services/medias.services';
import { USERS_MESSAGES } from '~/constants/messages';
import { sendFileFromS3, sendFileFromS3AsStream } from '~/utils/s3';

export const uploadImageController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadImage(req);
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
//nếu không sài s3 thì đoạn này sẽ dùng fs để đọc file local và stream về
export const serveVideosStreamController = async (req: Request, res: Response) => {
  const range = req.headers.range;

  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header');
  }

  const { name } = req.params;
  // const videoPath = path.resolve(UPLOAD_VIDEO_DIRECTORY, name);
  // if (!fs.existsSync(videoPath)) {
  //   return res.status(HTTP_STATUS.NOT_FOUND).send('Video not found');
  // }
  // const videoSize = fs.statSync(videoPath).size;
  // const contentType = mime.getType(videoPath) || 'video/mp4';

  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  // NOTE: Để lấy end và contentLength, cần lấy videoSize từ S3 (headObject)
  // const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);
  // const contentLength = end - start + 1;
  /**
   * res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${ContentLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': ContentType || 'video/mp4'
    });
   */

  // Gọi stream từ S3
  await sendFileFromS3AsStream(res, `videos/${name}`, start);
};

export const serveVideosM3u8Controller = async (req: Request, res: Response) => {
  const { id } = req.params;

  await sendFileFromS3(res, `videos-hls/${id}/master.m3u8`);

  // const filePath = path.resolve(UPLOAD_VIDEO_DIRECTORY, id, 'master.m3u8');

  // return res.sendFile(filePath, (err: unknown) => {
  //   if (err) {
  //     const error = err as Error & { status?: number };
  //     console.log(error);
  //     res.status(error.status || 404).json({ error: error.message || 'Video not found' });
  //   }
  // });
};

export const serveVideosHLSController = (req: Request, res: Response) => {
  const { id, v, segment } = req.params;

  sendFileFromS3(res, `videos-hls/${id}/${v}/${segment}`);

  // const filePath = path.resolve(UPLOAD_VIDEO_DIRECTORY, id, v, segment);

  // return res.sendFile(filePath, (err: unknown) => {
  //   if (err) {
  //     const error = err as Error & { status?: number };
  //     console.log(error);
  //     res.status(error.status || 404).json({ error: error.message || 'Video not found' });
  //   }
  // });
};
export const uploadVideoController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadVideo(req);
  res.json({
    message: 'Upload video successfully',
    ...url
  });
};

//Ví dụ như youtube
//giai đoạn 1: upload video lên server (mp4, mov...) người dùng chỉ cần đợi và bảo đảm bước này thành công
//giai đoạn 2: server xử lý encode video sang HLS (m3u8 + ts segments) (thường sẽ tốn thời gian và do server làm việc này)
//giai đoạn 3: server trả về đường dẫn để check encode thành công hay chưa

export const uploadVideoHLSController = async (req: Request, res: Response) => {
  const url = await mediaService.uploadHLSVideo(req);
  res.json({
    message: 'Upload video successfully',
    ...url
  });
};

export const videoStatusController = async (req: Request, res: Response) => {
  const { id } = req.params;

  const status = await mediaService.getVideoStatus(id as string);
  res.json({
    message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCESS,
    status
  });
};
