import { ObjectId } from 'mongodb';
import { MessageStatus } from '~/constants/enums';
type ConversationType = {
  _id?: ObjectId;
  conversationId?: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  message: string;
  timestamp: Date;
  status: MessageStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Conversation {
  _id?: ObjectId;
  conversationId?: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  message: string;
  timestamp: Date;
  status: MessageStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor({ _id, conversationId, senderId, recipientId, message, timestamp, status }: ConversationType) {
    const date = new Date();
    this._id = _id;
    this.conversationId = conversationId;
    this.senderId = senderId;
    this.recipientId = recipientId;
    this.message = message;
    this.timestamp = timestamp;
    this.status = status;
    this.created_at = date;
    this.updated_at = date;
  }
}
