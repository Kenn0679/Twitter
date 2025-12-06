import { Request } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import { verifyToken } from './jwt';

export const numberEnumToArray = (numberEnum: { [key: string]: number | string }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[];
};

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }

  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: process.env.JWT_ACCESS_SECRET as string
    });

    if (req) {
      (req as Request).decoded_authorization = decoded_authorization;
    }

    return decoded_authorization;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
};
