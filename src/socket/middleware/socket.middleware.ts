// src/socket/middleware/auth.middleware.ts
import { Socket } from 'socket.io';
import { USERS_MESSAGES } from '~/constants/messages';
import { verifyToken } from '~/utils/jwt';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED));
    }

    const decoded = await verifyToken({
      token,
      secretOrPublicKey: process.env.JWT_ACCESS_SECRET as string
    });

    // Lưu user_id vào socket data
    socket.data.user_id = decoded.user_id;
    socket.data.user = decoded;

    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    next(new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID));
  }
};
