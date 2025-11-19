import { checkSchema } from 'express-validator';
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums';
import { SEARCH_MESSAGES } from '~/constants/messages';
import validate from '~/utils/validation';

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: SEARCH_MESSAGES.CONTENT_MUST_BE_A_STRING
        }
      },
      media_type: {
        optional: true,
        custom: {
          options: (value) => {
            return Object.values(MediaTypeQuery).includes(value.toLowerCase());
          },
          errorMessage: SEARCH_MESSAGES.MEDIA_TYPE_INVALID
        }
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: SEARCH_MESSAGES.PEOPLE_FOLLOW_INVALID
        }
      }
    },
    ['query']
  )
);
