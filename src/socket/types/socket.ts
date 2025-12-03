// src/socket/types/socket.types.ts

export interface UserSocket {
  socket_id: string;
  status: 'online' | 'offline';
}

export interface PrivateMessageData {
  recipientId: string;
  message: string;
  timestamp?: string;
  tempId?: string;
  conversationId?: string;
  limit?: number;
  page?: number;
}

export interface TypingData {
  recipientId: string;
}

export interface UserStatusData {
  userId: string;
  status: 'online' | 'offline';
}

export interface MessageSentResponse {
  tempId?: string;
  conversationId: string;
  messageId: string;
  timestamp: string;
  messages: any[];
  totalPage: number;
}

export interface ErrorResponse {
  message: string;
}
