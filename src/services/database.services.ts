import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';
import VideoStatusSchema from '~/models/schemas/Video.Status.schema';
import Tweet from '~/models/schemas/Tweet.schema';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Bookmark from '~/models/schemas/Bookmark.schema';

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@twitter.nuepmhe.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`;
class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db(`${process.env.DB_NAME}`).command({ ping: 1 });
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
    return this.db.collection(`${process.env.DB_USER_COLLECTION}`);
  }

  async indexRefreshToken() {
    const exist = await this.refreshTokens.indexExists(['token_1', 'exp_1']);
    if (exist) return;
    await this.refreshTokens.createIndex({ token: 1 });
    await this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 });
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(`${process.env.DB_REFRESH_TOKEN_COLLECTION}`);
  }

  async indexFollower() {
    const exist = await this.followers.indexExists('user_id_1_followed_user_id_1');
    if (exist) return;
    await this.followers.createIndex({ user_id: 1, followed_user_id: 1 });
  }
  get followers(): Collection<Follower> {
    return this.db.collection(`${process.env.DB_FOLLOWERS_COLLECTION}`);
  }

  async indexVideoStatus() {
    const exist = await this.videoStatus.indexExists('name_1');
    if (exist) return;
    await this.videoStatus.createIndex({ name: 1 });
  }
  get videoStatus(): Collection<VideoStatusSchema> {
    return this.db.collection(`${process.env.DB_VIDEO_STATUS_COLLECTION}`);
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(`${process.env.DB_TWEETS_COLLECTION}`);
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(`${process.env.DB_HASHTAGS_COLLECTION}`);
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(`${process.env.DB_BOOKMARKS_COLLECTION}`);
  }
}

//Tạo object từ database service
const databaseService = new DatabaseService();
export default databaseService;
