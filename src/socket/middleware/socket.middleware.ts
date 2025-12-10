// src/socket/middleware/auth.middleware.ts
import { ExtendedError, Socket } from 'socket.io';
import { UserVerifyStatus } from '~/constants/enums';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import { TokenPayload } from '~/models/requests/user.request';
import { verifyAccessToken } from '~/utils/common';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    console.log(socket.handshake);
    const token = socket.handshake.headers.authorization?.split(' ')[1];

    const decoded = await verifyAccessToken(token as string);

    // Lưu user_id vào socket data
    socket.data.user_id = decoded.user_id;
    socket.data.user = decoded as TokenPayload;
    socket.data.auth = token;

    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(
        new ErrorWithStatus({
          message: error.message,
          status: (error as ErrorWithStatus).status
        })
      );
    }

    next(error as Error);
  }
};

export const socketAuthorizeEventMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    const access_token = socket.data.auth;
    const result = await verifyAccessToken(access_token as string);
    console.log(result);
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(
        new ErrorWithStatus({
          message: error.message,
          status: (error as ErrorWithStatus).status
        })
      );
    }
    next(error as Error);
  }
};

export const socketVerifyUserMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  const { verify } = socket.data.user as TokenPayload;

  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_EMAIL_NOT_VERIFIED,
        status: 403
      })
    );
  }
};
