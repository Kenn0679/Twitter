import { Router } from 'express';
import { serveImageController, serveVideosController } from '~/controllers/medias.controller';
import { wrapRequestHandler } from '~/utils/handlers';

const staticRoutes = Router();

staticRoutes.use('/images/:name', wrapRequestHandler(serveImageController));

staticRoutes.use('/videos/:name', wrapRequestHandler(serveVideosController));

export default staticRoutes;
