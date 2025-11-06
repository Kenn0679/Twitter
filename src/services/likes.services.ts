import { ObjectId, WithId } from 'mongodb';
import databaseService from './database.services';
import Like from '~/models/Schemas/Like.schema';
import { LIKE_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';

class LikesService {
  async likeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result as WithId<Like>;
  }

  async unlikeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    });

    return result as WithId<Like>;
  }

  async unlikeTweetById(like_id: string) {
    const result = await databaseService.likes.findOneAndDelete({
      _id: new ObjectId(like_id)
    });
    if (!result) {
      throw new ErrorWithStatus({ message: LIKE_MESSAGES.LIKE_NOT_FOUND, status: 404 });
    }

    return result as WithId<Like>;
  }
}

const likesService = new LikesService();

export default likesService;
