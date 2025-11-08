import { Router } from 'express';
import { createTweetController, getTweetController } from '~/controllers/tweets.controller';
import { createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middleware';
import { accessTokenValidator, isUserLoginValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const tweetsRouter = Router();

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);

tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  wrapRequestHandler(getTweetController)
);

export default tweetsRouter;
