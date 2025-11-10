import { Request, Response } from 'express';
import core from 'express-serve-static-core';
import { TweetType } from '~/constants/enums';
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
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id);
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views
  };
  return res.json({ message: TWEET_MESSAGES.TWEET_FETCHED_SUCCESSFULLY, data: tweet });
};

export const getTweetChildrenController = async (req: Request<TweetParam>, res: Response) => {
  const result = await tweetsService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    type: Number(req.query.type) as TweetType,
    limit: Number(req.query.limit),
    page: Number(req.query.page)
  });

  return res.json({ message: TWEET_MESSAGES.TWEET_CHILDREN_FETCHED_SUCCESSFULLY, data: result });
};
