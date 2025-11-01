import { Router } from 'express';
import {
  serveImageController,
  serveVideosHLSController,
  serveVideosM3u8Controller,
  serveVideosStreamController
} from '~/controllers/medias.controller';
import { wrapRequestHandler } from '~/utils/handlers';

const staticRoutes = Router();

staticRoutes.get('/images/:name', wrapRequestHandler(serveImageController));

staticRoutes.get('/videos-stream/:name', wrapRequestHandler(serveVideosStreamController));

staticRoutes.get('/videos-hls/:id/master.m3u8', wrapRequestHandler(serveVideosM3u8Controller));
staticRoutes.get('/videos-hls/:id/:v/:segment', wrapRequestHandler(serveVideosHLSController));

export default staticRoutes;
