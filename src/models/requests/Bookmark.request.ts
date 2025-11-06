import { ParamsDictionary } from 'express-serve-static-core';
export interface BookmarkRequestBody {
  tweet_id: string;
}

export interface unBookmarkTweetParams extends ParamsDictionary {
  tweet_id: string;
}
export interface unBookmarkByIdParams extends ParamsDictionary {
  bookmark_id: string;
}
