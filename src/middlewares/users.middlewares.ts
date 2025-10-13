import { Request } from 'express';
import { checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import databaseService from '~/services/database.services';
import userService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { verifyToken } from '~/utils/jwt';
import validate from '~/utils/validation';

const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            });
            if (!user) {
              throw new Error(USERS_MESSAGES.INVALID_CREDENTIALS);
            }

            req.user = user;

            return true;
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 6 },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS_LONG
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
);

const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_BETWEEN_1_AND_100_CHARACTERS
        },
        trim: true,
        errorMessage: 'Name is required and must be between 1 and 100 characters'
      },
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExisted = await userService.checkEmailExist(value);

            if (isExisted) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_IN_USE);
            }

            return true;
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 6 },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS_LONG
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      confirmPassword: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: { min: 6 },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS_LONG
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD);
            }
            return true;
          }
        }
      },
      dateOfBirth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
);

const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value.trim() || '').split(' ')[1];
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.TOKENS_ARE_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_ACCESS_SECRET as string
              });
              (req as Request).decoded_authorization = decoded_authorization;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            return true;
          }
        }
      }
    },
    ['headers']
  )
);

const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        isString: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
        },
        custom: {
          options: async (value: string) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.TOKENS_ARE_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            try {
              const [refresh_token] = await Promise.all([
                databaseService.refreshTokens.findOne({ token: value }),
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_REFRESH_SECRET as string })
              ]);

              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NO_LONGER_EXISTS,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }
              throw error;
            }
          }
        }
      }
    },
    ['body']
  )
);

const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            try {
              const [decoded_email_verify_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_EMAIL_SECRET as string }),
                databaseService.users.findOne({ email_verify_token: value })
              ]);

              if (!decoded_email_verify_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              (req as Request).decoded_email_verify_token = decoded_email_verify_token;
              return true;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
          }
        }
      }
    },
    ['body']
  )
);

export { loginValidator, registerValidator, accessTokenValidator, refreshTokenValidator, emailVerifyTokenValidator };
