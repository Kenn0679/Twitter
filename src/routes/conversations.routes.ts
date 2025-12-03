import { Router } from 'express';
import {
  getConversationsByRecipientController,
  getConversationsController
} from '~/controllers/conversations.controller';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const conversationsRoutes = Router();

conversationsRoutes.get(
  '/:conversationId',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getConversationsController)
);

conversationsRoutes.get(
  '/recipient/:recipientId',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getConversationsByRecipientController)
);

export default conversationsRoutes;
