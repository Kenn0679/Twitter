import { Request, Response } from 'express';
import core from 'express-serve-static-core';
import { TWEET_MESSAGES } from '~/constants/messages';
import { TweetParam, TweetRequestBody } from '~/models/requests/Tweet.request';
import { TokenPayload } from '~/models/requests/user.request';
import tweetsService from '~/services/tweets.services';

export const createTweetController = async (
  req: Request<core.ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await tweetsService.createTweet(user_id, req.body);
  return res.json({ message: TWEET_MESSAGES.TWEET_CREATED_SUCCESSFULLY, data: result });
};

export const getTweetController = async (req: Request<TweetParam>, res: Response) => {
  const { tweet_id } = req.params;
  return res.json({ message: TWEET_MESSAGES.TWEET_FETCHED_SUCCESSFULLY });
};
