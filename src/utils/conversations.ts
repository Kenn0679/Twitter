import { ObjectId } from 'mongodb';
import Conversation from '~/models/Schemas/Conversation.schema';

export const normalizeConversation = (doc: Conversation & { _id?: ObjectId }) => {
  if (!doc) return doc;
  return {
    ...doc,
    _id: doc._id?.toString(),
    conversationId: doc.conversationId ? doc.conversationId.toString() : undefined,
    senderId: doc.senderId?.toString(),
    recipientId: doc.recipientId?.toString(),
    timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : doc.timestamp
  };
};
