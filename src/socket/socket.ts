// src/socket/index.ts
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { UserSocket } from './types/socket';
import {
  socketAuthMiddleware,
  socketAuthorizeEventMiddleware,
  socketVerifyUserMiddleware
} from './middleware/socket.middleware';
import { MessageHandler } from './handler/messages.handler';
import { UserHandler } from './handler/users.handler';
import envConfig from '~/utils/envConfig';

// Lưu trữ mapping user_id -> socket_id và status
const users: { [key: string]: UserSocket } = {};

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: envConfig.frontendUrl || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);
  io.use(socketVerifyUserMiddleware);

  // Initialize handlers
  const messageHandler = new MessageHandler(io, users);
  const userHandler = new UserHandler(io, users);

  // Handle connections
  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    socket.use((_event, next) => socketAuthorizeEventMiddleware(socket, next));

    // Handle user connection
    userHandler.handleConnection(socket);

    // Register message event handlers
    socket.on('private_message', (data) => messageHandler.handlePrivateMessage(socket, data));
    socket.on('typing', (data) => messageHandler.handleTyping(socket, data));
    socket.on('client_message', (data) => messageHandler.handleClientMessage(socket, data));

    // Handle disconnection
    socket.on('disconnect', () => userHandler.handleDisconnect(socket));
  });

  console.log('Socket.IO initialized');
  return io;
};

// Export users object for external access if needed
export { users };
