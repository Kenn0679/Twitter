import { Collection, Db, MongoClient } from 'mongodb';
import User from '~/models/Schemas/User.schema';
import RefreshToken from '~/models/Schemas/RefreshToken.schema';
import Follower from '~/models/Schemas/Follower.schema';
import VideoStatusSchema from '~/models/Schemas/Video.Status.schema';
import Tweet from '~/models/Schemas/Tweet.schema';
import Hashtag from '~/models/Schemas/Hashtag.schema';
import Bookmark from '~/models/Schemas/Bookmark.schema';
import Like from '~/models/Schemas/Like.schema';
import Conversation from '~/models/Schemas/Conversation.schema';
import envConfig from '~/utils/envConfig';

const uri = `mongodb+srv://${envConfig.dbUser}:${envConfig.dbPass}@twitter.nuepmhe.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`;
class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(envConfig.dbName);
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db(`${envConfig.dbName}`).command({ ping: 1 });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async indexUser() {
    const exist = await this.users.indexExists(['username_1', 'email_1', 'password_1_email_1']);
    if (exist) return;
    await this.users.createIndex({ username: 1 }, { unique: true });
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.users.createIndex({ password: 1, email: 1 });
  }
  get users(): Collection<User> {
    return this.db.collection(`${envConfig.dbUserCollection}`);
  }

  async indexRefreshToken() {
    const exist = await this.refreshTokens.indexExists(['token_1', 'exp_1']);
    if (exist) return;
    await this.refreshTokens.createIndex({ token: 1 });
    await this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 });
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(`${envConfig.dbRefreshTokenCollection}`);
  }

  async indexFollower() {
    const exist = await this.followers.indexExists('user_id_1_followed_user_id_1');
    if (exist) return;
    await this.followers.createIndex({ user_id: 1, followed_user_id: 1 });
  }
  get followers(): Collection<Follower> {
    return this.db.collection(`${envConfig.dbFollowersCollection}`);
  }

  async indexVideoStatus() {
    const exist = await this.videoStatus.indexExists('name_1');
    if (exist) return;
    await this.videoStatus.createIndex({ name: 1 });
  }
  get videoStatus(): Collection<VideoStatusSchema> {
    return this.db.collection(`${envConfig.dbVideoStatusCollection}`);
  }

  async indexTweets() {
    const exist = await this.tweets.indexExists('content_text');
    if (exist) return;
    await this.tweets.createIndex({ content: 'text' }, { default_language: 'none' });
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(`${envConfig.dbTweetsCollection}`);
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(`${envConfig.dbHashtagsCollection}`);
  }
  async indexHashtags() {
    const exist = await this.hashtags.indexExists('name_1');
    if (exist) return;
    await this.hashtags.createIndex({ name: 'text' }, { unique: true, default_language: 'none' });
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(`${envConfig.dbBookmarksCollection}`);
  }

  get likes(): Collection<Like> {
    return this.db.collection(`${envConfig.dbLikesCollection}`);
  }

  get conversation(): Collection<Conversation> {
    return this.db.collection(`${envConfig.dbConversationsCollection}`);
  }
}

//Tạo object từ database service
const databaseService = new DatabaseService();
export default databaseService;
