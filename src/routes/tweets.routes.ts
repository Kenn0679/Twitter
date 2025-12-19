import { Router } from 'express';
import {
  createTweetController,
  getTweetController,
  getTweetChildrenController,
  getNewsFeedTweetsController,
  getLikedTweetsController
} from '~/controllers/tweets.controller';
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middleware';
import { accessTokenValidator, isUserLoginValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const tweetsRouter = Router();

//đối với project này vì chưa update client, nên tạm thời sẽ update view cho tweet khi lấy tweet details
//thông thường (đã tạo function increase view) thì khi lướt tới tweet nào thì tăng view tweet đó chứ không phải khi lấy details

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);
//get new feed tweets
tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewsFeedTweetsController)
);
//get list tweets you have liked
tweetsRouter.get(
  '/liked-tweets',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getLikedTweetsController)
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
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
);
export default tweetsRouter;
