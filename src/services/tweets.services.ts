import { TweetRequestBody } from '~/models/requests/Tweet.request';
import { ObjectId, WithId } from 'mongodb';
import databaseService from './database.services';
import Tweet from '~/models/Schemas/Tweet.schema';
import Hashtag from '~/models/Schemas/Hashtag.schema';
import { TweetType } from '~/constants/enums';

class TweetsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtag trong database, nếu có thì lấy, không thì tạo mới
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        );
      })
    );

    return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id);
  }

  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags);

    const result = await databaseService.tweets.insertOne(
      new Tweet({
        content: body.content,
        type: body.type,
        parent_id: body.parent_id,
        audience: body.audience,
        hashtags,
        mentions: body.mentions,
        medias: body.medias,
        user_id: new ObjectId(user_id)
      })
    );
    return result;
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const isLogin = user_id ? { user_views: 1 } : { guest_views: 1 };
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: isLogin,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    );

    return result as {
      guest_views: number;
      user_views: number;
      updated_at: Date;
    };
  }

  async getTweetChildren({
    tweet_id,
    type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string;
    type: number;
    limit: number;
    page: number;
    user_id?: string;
  }) {
    const isLogin = user_id ? { user_views: 1 } : { guest_views: 1 };
    const date = new Date();

    const tweets = await databaseService.tweets
      .aggregate([
        {
          $match: {
            type,
            parent_id: new ObjectId(tweet_id)
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
                    $eq: ['$$item.type', TweetType.Retweet]
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
                    $eq: ['$$item.type', TweetType.Comment]
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
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray();

    const ids = tweets.map((tweet) => tweet._id as ObjectId);
    const [total] = await Promise.all([
      await databaseService.tweets.countDocuments({
        type,
        parent_id: new ObjectId(tweet_id)
      }),
      await databaseService.tweets.updateMany(
        {
          _id: { $in: ids }
        },
        {
          $inc: isLogin,
          $set: { updated_at: date } //vì updateMany không hỗ trợ $currentDate trả về nên dùng $set với date hiện tại
        }
      )
    ]);

    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      if (user_id) {
        tweet.user_views += 1;
      } else {
        tweet.guest_views += 1;
      }
    });

    const totalPage = Math.ceil(total / limit);
    return { tweets, totalPage };
  }
}

const tweetsService = new TweetsService();

export default tweetsService;
