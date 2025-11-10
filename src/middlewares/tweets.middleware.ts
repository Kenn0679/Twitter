import validate from '~/utils/validation';
import { NextFunction, Request, Response } from 'express';
import { checkSchema, ParamSchema } from 'express-validator';
import { numberEnumToArray } from '~/utils/common';
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';
import { TWEET_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import { ObjectId } from 'mongodb';
import { isEmpty } from 'lodash';
import databaseService from '~/services/database.services';
import { ErrorWithStatus } from '~/models/Errors';
import Tweet from '~/models/Schemas/Tweet.schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { wrapRequestHandler } from '~/utils/handlers';

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
        options: (value, { req }) => {
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
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({ message: TWEET_MESSAGES.TWEET_ID_INVALID, status: 400 });
            }

            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'mentions',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 1]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 2]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 3]
                          }
                        }
                      }
                    },
                    views: {
                      $add: ['$user_views', '$guest_views']
                    }
                  }
                },
                {
                  $project: {
                    tweet_children: 0
                  }
                }
              ])
              .toArray();

            console.log(tweet);
            if (!tweet) {
              throw new ErrorWithStatus({ message: TWEET_MESSAGES.TWEET_NOT_FOUND, status: 404 });
            }
            (req as Request).tweet = tweet as Tweet;
            return true;
          }
        }
      }
    },
    ['params', 'body']
  )
);

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet;

  if (tweet.audience === TweetAudience.TwitterCircle) {
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.UNAUTHORIZED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }

    const author = await databaseService.users.findOne({
      _id: new ObjectId(tweet.user_id)
    });
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      });
    }

    const { user_id } = req.decoded_authorization;
    const isInTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id));

    if (!isInTwitterCircle && !author._id.equals(user_id)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC
      });
    }
  }
  next();
});
