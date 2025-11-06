import { Request, Response } from 'express';
import core from 'express-serve-static-core';
import { LIKE_MESSAGES } from '~/constants/messages';
import { LikeRequestBody, unlikeTweetParams } from '~/models/requests/Like.request';
import { TokenPayload } from '~/models/requests/user.request';
import likesService from '~/services/likes.services';

export const likeTweetController = async (req: Request<core.ParamsDictionary, any, LikeRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const tweet_id = req.body.tweet_id;
  const result = await likesService.likeTweet(user_id, tweet_id);
  return res.json({ message: LIKE_MESSAGES.LIKE_ADDED_SUCCESSFULLY, data: result });
};

export const unlikeTweetController = async (req: Request<unlikeTweetParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const tweet_id = req.params.tweet_id;
  await likesService.unlikeTweet(user_id, tweet_id);
  return res.json({ message: LIKE_MESSAGES.LIKE_REMOVED_SUCCESSFULLY });
};

export const unlikeTweetByIdController = async (req: Request<unlikeTweetParams>, res: Response) => {
  const like_id = req.params.tweet_id;
  await likesService.unlikeTweetById(like_id);
  return res.json({ message: LIKE_MESSAGES.LIKE_REMOVED_SUCCESSFULLY });
};
