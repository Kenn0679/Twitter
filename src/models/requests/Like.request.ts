import { ParamsDictionary } from 'express-serve-static-core';

export interface LikeRequestBody {
  tweet_id: string;
}

export interface unlikeTweetParams extends ParamsDictionary {
  tweet_id: string;
}
export interface unlikeByIdParams extends ParamsDictionary {
  like_id: string;
}
