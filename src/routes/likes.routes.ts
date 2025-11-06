import { Router } from 'express';
import { likeTweetController, unlikeTweetByIdController, unlikeTweetController } from '~/controllers/likes.controller';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const likesRoutes = Router();

likesRoutes.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(likeTweetController));

likesRoutes.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unlikeTweetController)
);
likesRoutes.delete(
  '/:like_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unlikeTweetByIdController)
);

export default likesRoutes;
