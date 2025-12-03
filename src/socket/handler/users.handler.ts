// src/socket/handlers/user.handler.ts
import { Socket, Server } from 'socket.io';
import { UserSocket } from '~/socket/types/socket';

export class UserHandler {
  private io: Server;
  private users: { [key: string]: UserSocket };

  constructor(io: Server, users: { [key: string]: UserSocket }) {
    this.io = io;
    this.users = users;
  }

  handleConnection = (socket: Socket) => {
    const user_id = socket.data.user_id;

    if (!user_id) {
      socket.disconnect();
      return;
    }

    // Save user to active users
    this.users[user_id] = {
      socket_id: socket.id,
      status: 'online'
    };

    // Broadcast user online status
    socket.broadcast.emit('user_status', { userId: user_id, status: 'online' });

    // Send welcome message
    socket.emit('welcome', `Welcome ${user_id}`);

    console.log('User connected:', user_id);
  };

  handleDisconnect = (socket: Socket) => {
    const user_id = socket.data.user_id;

    if (!user_id) return;

    console.log('User disconnected:', user_id);

    // Update status
    if (this.users[user_id]) {
      this.users[user_id].status = 'offline';
    }

    // Broadcast user offline status
    socket.broadcast.emit('user_status', { userId: user_id, status: 'offline' });
  };
}
