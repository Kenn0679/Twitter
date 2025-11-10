import { Router } from 'express';
import { createTweetController, getTweetController, getTweetChildrenController } from '~/controllers/tweets.controller';
import { audienceValidator, createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middleware';
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
//get tweet details
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
);
//get tweet children (retweets, comments, quotes)
tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
);

export default tweetsRouter;
