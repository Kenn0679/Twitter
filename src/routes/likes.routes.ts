import { Router } from 'express';
import { likeTweetController, unlikeTweetByIdController, unlikeTweetController } from '~/controllers/likes.controller';
import { tweetIdValidator } from '~/middlewares/tweets.middleware';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const likesRouter = Router();

likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
);

likesRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unlikeTweetController)
);
likesRouter.delete(
  '/:like_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unlikeTweetByIdController)
);

export default likesRouter;
