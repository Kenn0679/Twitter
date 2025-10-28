import { Router } from 'express';
import { serveImageController } from '~/controllers/medias.controller';

const staticRoutes = Router();

staticRoutes.use('/images/:name', serveImageController);

export default staticRoutes;
