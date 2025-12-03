import { checkSchema } from 'express-validator';
import { CONVERSATION_MESSAGES } from '~/constants/messages';
import validate from '~/utils/validation';

export const getConversationsMiddleware = validate(
  checkSchema(
    {
      conversationId: {
        isMongoId: true,
        errorMessage: CONVERSATION_MESSAGES.INVALID_CONVERSATION_ID
      }
    },
    ['params']
  )
);
