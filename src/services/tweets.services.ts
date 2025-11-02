import { TweetRequestBody } from '~/models/requests/Tweet.request';
import databaseService from './database.services';
import Tweet from '~/models/schemas/Tweet.schema';
import { ObjectId } from 'mongodb';

class TweetsService {
  async createTweet(user_id: string, body: TweetRequestBody) {
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        content: body.content,
        type: body.type,
        parent_id: body.parent_id,
        audience: body.audience,
        hashtags: [], //thiếu table hastags
        mentions: body.mentions,
        medias: body.medias,
        user_id: new ObjectId(user_id)
      })
    );
    return result;
  }
}

const tweetsService = new TweetsService();

export default tweetsService;
