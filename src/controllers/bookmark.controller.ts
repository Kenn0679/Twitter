import { Request, Response } from 'express';
import core from 'express-serve-static-core';
import { BOOKMARK_MESSAGES } from '~/constants/messages';
import { BookmarkRequestBody } from '~/models/requests/Bookmark.request';
import { TokenPayload } from '~/models/requests/user.request';
import bookmarkService from '~/services/bookmarks.services';

export const createBookmarkController = async (
  req: Request<core.ParamsDictionary, any, BookmarkRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const tweet_id = req.body.tweet_id;
  const result = await bookmarkService.bookmarkTweet(user_id, tweet_id);
  return res.json({ message: BOOKMARK_MESSAGES.BOOKMARK_CREATED_SUCCESSFULLY, data: result });
};
