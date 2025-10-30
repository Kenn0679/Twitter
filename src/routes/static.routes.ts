import { Router } from 'express';
import { serveImageController, serveVideosStreamController } from '~/controllers/medias.controller';
import { wrapRequestHandler } from '~/utils/handlers';

const staticRoutes = Router();

staticRoutes.use('/images/:name', wrapRequestHandler(serveImageController));

staticRoutes.use('/videos-stream/:name', wrapRequestHandler(serveVideosStreamController));

export default staticRoutes;
