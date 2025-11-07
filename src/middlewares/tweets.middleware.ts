import validate from '~/utils/validation';
import { NextFunction, Request, Response } from 'express';
import { checkSchema, ParamSchema } from 'express-validator';
import { numberEnumToArray } from '~/utils/common';
import { MediaType, TweetAudience, TweetType } from '~/constants/enums';
import { TWEET_MESSAGES } from '~/constants/messages';
import { ObjectId } from 'mongodb';
import { isEmpty } from 'lodash';
import databaseService from '~/services/database.services';
import { ErrorWithStatus } from '~/models/Errors';

const tweetType = numberEnumToArray(TweetType);
const tweetAudience = numberEnumToArray(TweetAudience);
const mediaTypes = numberEnumToArray(MediaType);

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetType]
      },
      errorMessage: TWEET_MESSAGES.TWEET_TYPE_INVALID
    },
    audience: {
      isIn: {
        options: [tweetAudience]
      },
      errorMessage: TWEET_MESSAGES.TWEET_AUDIENCE_INVALID
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type;

          //nếu không phải tweet gốc thì parent_id là bắt buộc và phải là ObjectId hợp lệ
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_VALID_TWEET_ID);
          }

          //nếu là tweet gốc thì parent_id phải là khác null
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL);
          }
          return true;
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type;
          const hashtags = req.body.hashtags as string[];
          const mentions = req.body.mentions as string[];

          //nếu type là comment quote tưeet, tweet và không có mentions và hashtags thì content phải là string và không được để trống
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            (typeof value !== 'string' || value.trim() === '')
          ) {
            throw new Error(TWEET_MESSAGES.TWEET_CONTENT_IS_REQUIRED);
          }

          //nếu type là retweet thì phải là rỗng
          if (type === TweetType.Retweet && value.trim() !== '') {
            throw new Error(TWEET_MESSAGES.TWEET_CONTENT_MUST_BE_EMPTY);
          }
          return true;
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value) => {
          // Yêu cầu mỗi phần từ trong array là string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEET_MESSAGES.TWEET_HASHTAGS_MUST_BE_STRINGS);
          }
          return true;
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value) => {
          // Yêu cầu mỗi phần từ trong array là user_id
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGES.TWEET_MENTIONS_MUST_BE_VALID_USER_IDS);
          }
          return true;
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value) => {
          // Yêu cầu mỗi phần từ trong array là Media Object
          if (
            !value.every((item: any) => {
              return typeof item.url === 'string' && mediaTypes.includes(item.type);
            })
          ) {
            throw new Error(TWEET_MESSAGES.TWEET_MEDIAS_MUST_BE_ARRAY_OF_MEDIA_OBJECTS);
          }
          return true;
        }
      }
    }
  })
);

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({ message: TWEET_MESSAGES.TWEET_ID_INVALID, status: 400 });
            }

            const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(value) });

            if (!tweet) {
              throw new ErrorWithStatus({ message: TWEET_MESSAGES.TWEET_NOT_FOUND, status: 404 });
            }
          }
        }
      }
    },
    ['params', 'body']
  )
);
