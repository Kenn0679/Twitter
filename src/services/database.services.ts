import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schemas';
import RefreshToken from '~/models/schemas/RefreshToken.schema';

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

  get users(): Collection<User> {
    return this.db.collection(`${process.env.DB_USER_COLLECTION}`);
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(`${process.env.DB_REFRESH_TOKEN_COLLECTION}`);
  }
}

//Tạo object từ database service
const databaseService = new DatabaseService();
export default databaseService;
