import { Router } from 'express';
import {
  getConversationsByRecipientController,
  getConversationsController
} from '~/controllers/conversations.controller';
import {
  getConversationsByRecipientMiddleware,
  getConversationsMiddleware
} from '~/middlewares/conversations.middleware';
import { paginationValidator } from '~/middlewares/tweets.middleware';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const conversationsRoutes = Router();

conversationsRoutes.get(
  '/:conversationId',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationsMiddleware,
  wrapRequestHandler(getConversationsController)
);

conversationsRoutes.get(
  '/recipient/:recipientId',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationsByRecipientMiddleware,
  wrapRequestHandler(getConversationsByRecipientController)
);

export default conversationsRoutes;
