import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import Conversation from '~/models/Schemas/Conversation.schema';
import { normalizeConversation } from '~/utils/conversations';

const toObjectId = (id?: string | ObjectId) => {
  if (!id) return undefined;
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(id) ? new ObjectId(id) : undefined;
};

class ConversationsServices {
  async getConversations(conversationId: string, limit = 20, page = 1) {
    if (!conversationId) {
      return { result: [], totalPage: 0 };
    }
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 20;
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const conversationObjectId = toObjectId(conversationId) as ObjectId;

    const filter = { conversationId: conversationObjectId, message: { $exists: true } };
    const [result, totalDocs] = await Promise.all([
      databaseService.conversation
        .find(filter)
        .sort({ timestamp: 1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .toArray(),
      databaseService.conversation.countDocuments(filter)
    ]);

    return {
      result: result.map((doc) => normalizeConversation(doc as Conversation & { _id?: ObjectId })),
      totalPage: Math.ceil(totalDocs / parsedLimit)
    };
  }

  async getConversationsByRecipient(recipientId: string, senderId: string, limit = 50, page = 1) {
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 50;
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    const recipientObjectId = toObjectId(recipientId);
    const senderObjectId = toObjectId(senderId);

    const orConditions: Record<string, unknown>[] = [
      { recipientId, senderId },
      { recipientId: senderId, senderId: recipientId }
    ];

    if (recipientObjectId && senderObjectId) {
      orConditions.push({ recipientId: recipientObjectId, senderId: senderObjectId });
      orConditions.push({ recipientId: senderObjectId, senderId: recipientObjectId });
    }

    const filter = {
      message: { $exists: true },
      $or: orConditions
    };

    const [result, totalDocs] = await Promise.all([
      databaseService.conversation
        .find(filter)
        .sort({ timestamp: 1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .toArray(),
      databaseService.conversation.countDocuments(filter)
    ]);

    return {
      result: result.map((doc) => normalizeConversation(doc as Conversation & { _id?: ObjectId })),
      totalPage: Math.ceil(totalDocs / parsedLimit)
    };
  }

  async findOrCreateConversation(senderId: string, recipientId: string) {
    const existingConversation = await databaseService.conversation.findOne({
      $or: [
        { senderId: new ObjectId(senderId), recipientId: new ObjectId(recipientId) },
        { senderId: new ObjectId(recipientId), recipientId: new ObjectId(senderId) }
      ]
    });

    // Nếu đã có tin nhắn giữa 2 user
    if (existingConversation) {
      // Nếu đã có conversationId thì dùng luôn
      if (existingConversation.conversationId) {
        return { _id: existingConversation.conversationId as ObjectId };
      }

      // Nếu chưa có conversationId, dùng _id của message đầu tiên làm conversationId
      if (existingConversation._id) {
        await databaseService.conversation.updateOne(
          { _id: existingConversation._id },
          { $set: { conversationId: existingConversation._id } }
        );
        return { _id: existingConversation._id as ObjectId };
      }
    }

    // Chưa có cuộc hội thoại, tạo conversationId mới (chưa cần insert doc riêng)
    const newConversationId = new ObjectId();
    return { _id: newConversationId };
  }
}
const conversationsService = new ConversationsServices();
export default conversationsService;
