import { checkSchema } from 'express-validator';
import { values } from 'lodash';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from '~/constants/httpStatus';
import { CONVERSATION_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import databaseService from '~/services/database.services';
import validate from '~/utils/validation';

export const getConversationsMiddleware = validate(
  checkSchema(
    {
      conversationId: {
        isMongoId: true,
        errorMessage: CONVERSATION_MESSAGES.INVALID_CONVERSATION_ID,
        custom: {
          options: async (values) => {
            const conversation = await databaseService.conversation.findOne({
              conversationId: new ObjectId(values)
            });

            if (!conversation) {
              throw new ErrorWithStatus({
                message: CONVERSATION_MESSAGES.CONVERSATION_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }

            return true;
          }
        }
      }
    },
    ['params']
  )
);

export const getConversationsByRecipientMiddleware = validate(
  checkSchema(
    {
      recipientId: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.USER_ID_IS_REQUIRED
        },
        custom: {
          options: async (value: string) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.INVALID_USER_ID,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }

            const user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            });

            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }

            return true;
          }
        }
      }
    },
    ['params']
  )
);
