import { Request, Response } from 'express';
import conversationsService from '~/services/conversations.services';

export const getConversationsController = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { limit, page } = req.query;
  const limitNumber = Number(limit) > 0 ? Number(limit) : 20;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const result = await conversationsService.getConversations(conversationId, limitNumber, pageNumber);
  return res.json({
    message: 'Get conversations controller',
    result: result.result,
    totalPage: result.totalPage
  });
};

export const getConversationsByRecipientController = async (req: Request, res: Response) => {
  const { recipientId } = req.params;
  const { limit, page } = req.query;
  const senderId = req.decoded_authorization?.user_id as string;
  const limitNumber = Number(limit) > 0 ? Number(limit) : 50;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const result = await conversationsService.getConversationsByRecipient(recipientId, senderId, limitNumber, pageNumber);
  return res.json({
    message: 'Get conversations by recipient controller',
    result: result.result,
    totalPage: result.totalPage
  });
};
