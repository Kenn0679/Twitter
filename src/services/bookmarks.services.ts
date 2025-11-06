import { ObjectId, WithId } from 'mongodb';
import databaseService from './database.services';
import Bookmark from '~/models/Schemas/Bookmark.schema';
import { BOOKMARK_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';

class BookmarkService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result as WithId<Bookmark>;
  }

  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    });
    if (!result) throw new ErrorWithStatus({ message: BOOKMARK_MESSAGES.BOOKMARK_NOT_FOUND, status: 404 });
    return result;
  }

  async unBookmarkTweetById(bookmark_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      _id: new ObjectId(bookmark_id)
    });
    if (!result) throw new ErrorWithStatus({ message: BOOKMARK_MESSAGES.BOOKMARK_NOT_FOUND, status: 404 });
    return result;
  }
}

const bookmarkService = new BookmarkService();

export default bookmarkService;
