import { Socket, Server } from 'socket.io';
import { ObjectId } from 'mongodb';
import databaseService from '~/services/database.services';
import conversationsService from '~/services/conversations.services';
import Conversation from '~/models/Schemas/Conversation.schema';
import { MessageStatus } from '~/constants/enums';
import { normalizeConversation } from '~/utils/conversations';
import { PrivateMessageData, UserSocket } from '~/socket/types/socket';

export class MessageHandler {
  private io: Server;
  private users: { [key: string]: UserSocket };

  constructor(io: Server, users: { [key: string]: UserSocket }) {
    this.io = io;
    this.users = users;
  }

  handlePrivateMessage = async (socket: Socket, data: PrivateMessageData) => {
    const { recipientId, message, timestamp, tempId, limit = 10, page = 1 } = data;
    let { conversationId } = data;
    const senderId = socket.data.user_id;

    if (!recipientId || !message) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    try {
      const recipientObjectId = new ObjectId(recipientId);
      const senderObjectId = new ObjectId(senderId);

      // Ensure recipient exists
      const recipient = await databaseService.users.findOne({ _id: recipientObjectId });
      if (!recipient) {
        socket.emit('error', { message: 'Recipient not found' });
        return;
      }

      // Find or create conversation metadata
      if (!conversationId) {
        const conversation = await conversationsService.findOrCreateConversation(senderId, recipientId);
        conversationId = conversation._id.toString();
      }

      const conversationObjectId = new ObjectId(conversationId);

      // Prepare message payload
      const messageDoc = new Conversation({
        conversationId: conversationObjectId,
        senderId: senderObjectId,
        recipientId: recipientObjectId,
        message,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status: MessageStatus.SENT
      });

      // Save message to database
      const result = await databaseService.conversation.insertOne(messageDoc);
      const savedMessage = {
        ...messageDoc,
        _id: result.insertedId
      };

      // Send to recipient if online
      const recipientSocket = this.users[recipientId];
      if (recipientSocket && recipientSocket.status === 'online') {
        const deliveredMessage = {
          ...savedMessage,
          status: MessageStatus.RECEIVED
        };

        socket.to(recipientSocket.socket_id).emit('new_message', normalizeConversation(deliveredMessage));

        // Update message status in database
        await databaseService.conversation.updateOne(
          { _id: savedMessage._id },
          { $set: { status: MessageStatus.RECEIVED } }
        );
      }

      // Use getConversations to fetch messages if client requests pagination
      const { result: messages, totalPage } = await conversationsService.getConversations(conversationId, limit, page);

      // Confirm to sender
      socket.emit('message_sent', {
        tempId,
        conversationId,
        messageId: savedMessage._id.toString(),
        timestamp:
          savedMessage.timestamp instanceof Date ? savedMessage.timestamp.toISOString() : savedMessage.timestamp,
        messages,
        totalPage
      });
    } catch (error) {
      console.error('Error handling private message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  };

  handleTyping = (socket: Socket, data: { recipientId?: string }) => {
    const { recipientId } = data || {};
    if (!recipientId) return;

    const recipientSocket = this.users[recipientId];
    if (recipientSocket && recipientSocket.status === 'online') {
      socket.to(recipientSocket.socket_id).emit('user_typing', { senderId: socket.data.user_id });
    }
  };

  // Legacy handler for compatibility
  handleClientMessage = (socket: Socket, data: any) => {
    console.log('message from client:', data);
    socket.emit('server_message', 'Server received your message!');
  };
}
