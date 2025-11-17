import databaseService from './database.services';
import { MediaType, MediaTypeQuery, PeopleFollow, TweetType } from '~/constants/enums';
import { ObjectId } from 'mongodb';

class SearchServices {
  async search({
    limit,
    page,
    content,
    user_id,
    media_type,
    people_follow
  }: {
    limit: number;
    page: number;
    content: string;
    user_id: string;
    media_type?: MediaTypeQuery;
    people_follow?: PeopleFollow;
  }) {
    const matchStage: any = {
      $text: {
        $search: content
      }
    };
    if (media_type) {
      if (media_type === MediaTypeQuery.IMAGE) {
        matchStage['medias.type'] = MediaType.Image;
      }
      if (media_type === MediaTypeQuery.VIDEO) {
        matchStage['medias.type'] = { $in: [MediaType.Video, MediaType.HLS] };
      }
    }
    if (people_follow && people_follow === PeopleFollow.Following) {
      console.log('here in people_following');
      const userId_ObjectID = new ObjectId(user_id);
      const followed_user_ids = await databaseService.followers
        .find(
          { user_id: userId_ObjectID },
          {
            projection: {
              followed_user_id: 1,
              _id: 0
            }
          }
        )
        .toArray();
      const ids = followed_user_ids.map((item) => item.followed_user_id);
      ids.push(userId_ObjectID);
      matchStage['user_id'] = { $in: ids };
      console.log(ids);
    }
    const [tweets, total] = await Promise.all([
      await databaseService.tweets
        .aggregate([
          {
            $match: matchStage
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new Object(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
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
              tweet_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      await databaseService.tweets
        .aggregate([
          {
            $match: matchStage
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user',
              pipeline: [
                {
                  $project: {
                    twitter_circle: 1
                  }
                }
              ]
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ]);

    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId);
    const date = new Date();

    await databaseService.tweets.updateMany(
      {
        _id: { $in: tweet_ids }
      },
      {
        $inc: { user_views: 1 },
        $set: { updated_at: date } //vì updateMany không hỗ trợ $currentDate trả về nên dùng $set với date hiện tại
      }
    );
    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      tweet.user_views += 1;
    });

    const totalPage = Math.ceil(total[0]?.total / limit) || 1;
    return {
      tweets,
      totalPage
    };
  }
}

const searchService = new SearchServices();
export default searchService;
