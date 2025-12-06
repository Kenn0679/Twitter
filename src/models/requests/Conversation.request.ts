import { ParamsDictionary } from 'express-serve-static-core';

export interface GetConversationParam extends ParamsDictionary {
  conversationId: string;
}

export interface GetConversationsByRecipientParam extends ParamsDictionary {
  recipientId: string;
}
