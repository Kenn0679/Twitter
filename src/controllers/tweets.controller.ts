import { Request, Response } from 'express';
import core, { ParamsDictionary } from 'express-serve-static-core';
import { TweetType } from '~/constants/enums';
import { TWEET_MESSAGES } from '~/constants/messages';
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.request';
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
    user_views: result.user_views,
    updated_at: result.updated_at
  };
  return res.json({ message: TWEET_MESSAGES.TWEET_FETCHED_SUCCESSFULLY, data: tweet });
};

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const { tweet_id } = req.params;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const type = Number(req.query.type) as TweetType;
  const user_id = req.decoded_authorization?.user_id;

  const { tweets, totalPage } = await tweetsService.getTweetChildren({
    tweet_id,
    type,
    limit,
    page,
    user_id
  });

  return res.json({
    message: TWEET_MESSAGES.TWEET_CHILDREN_FETCHED_SUCCESSFULLY,
    data: {
      tweets,
      limit,
      page,
      total_page: totalPage
    }
  });
};

export const getNewsFeedTweetsController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id as string;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);

  const result = await tweetsService.getNewsFeedTweets({
    user_id,
    limit,
    page
  });
  res.json({
    message: TWEET_MESSAGES.NEW_FEED_TWEETS_FETCHED_SUCCESSFULLY,
    data: { ...result, limit, page }
  });
};
