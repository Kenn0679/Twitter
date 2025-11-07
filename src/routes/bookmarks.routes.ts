import { Router } from 'express';
import {
  createBookmarkController,
  unBookmarkByIdController,
  unBookmarkController
} from '~/controllers/bookmarks.controller';
import { tweetIdValidator } from '~/middlewares/tweets.middleware';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarksRouter = Router();

bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(createBookmarkController)
);

bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unBookmarkController)
);

bookmarksRouter.delete(
  '/:bookmark_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unBookmarkByIdController)
);

export default bookmarksRouter;
