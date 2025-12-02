import defaultErrorHandler from './middlewares/error.middleware';
import express from 'express';
import usersRouter from './routes/users.route';
import databaseService from './services/database.services';
import dotenv from 'dotenv';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/File';
import staticRoutes from './routes/static.routes';
import { UPLOAD_VIDEO_DIRECTORY } from './constants/dir';
import cors from 'cors';
import tweetsRouter from './routes/tweets.routes';
import bookmarksRouter from './routes/bookmarks.routes';
import likesRouter from './routes/likes.routes';
import searchRouter from './routes/search.routes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './utils/jwt';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = await verifyToken({
      token,
      secretOrPublicKey: process.env.JWT_ACCESS_SECRET as string
    });

    // Lưu user_id vào socket data
    socket.data.user_id = decoded.user_id;
    socket.data.user = decoded;

    next();
  } catch {
    next(new Error('Authentication error: Invalid token'));
  }
});
// Lưu trữ mapping user_id -> socket_id và messages tạm trong memory
const users: {
  [key: string]: {
    socket_id: string;
    status: 'online' | 'offline';
  };
} = {};

// Lưu messages tạm trong memory (chỉ tồn tại khi server chạy)
const conversations: {
  [key: string]: Array<{
    messageId: string;
    senderId: string;
    recipientId: string;
    message: string;
    timestamp: string;
    status: 'sent' | 'received' | 'read';
  }>;
} = {};

// Helper function: Tạo conversation key từ 2 user_id
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('_');
};

io.on('connection', (socket) => {
  console.log('a user connected');

  const user_id = socket.data.user_id;
  if (!user_id) {
    socket.disconnect();
    return;
  }

  // Lưu user vào active users
  users[user_id] = {
    socket_id: socket.id,
    status: 'online'
  };

  // Welcome message
  socket.emit('welcome', `đéo chào mừng mày dm ${user_id}`);

  // Notify contacts về status change (nếu cần)
  // Có thể implement sau

  // Xử lý private message
  socket.on('private_message', (data) => {
    const { recipientId, message, tempId, timestamp } = data;
    const senderId = user_id;

    if (!recipientId || !message) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    // Tạo message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Lưu message vào conversation tạm
    const convKey = getConversationKey(senderId, recipientId);
    if (!conversations[convKey]) {
      conversations[convKey] = [];
    }
    conversations[convKey].push({
      messageId,
      senderId,
      recipientId,
      message,
      timestamp: timestamp || new Date().toISOString(),
      status: 'sent'
    });

    // Gửi đến recipient nếu online
    const recipient = users[recipientId];
    if (recipient && recipient.status === 'online') {
      socket.to(recipient.socket_id).emit('private_message', {
        messageId,
        message,
        senderId,
        timestamp: timestamp || new Date().toISOString(),
        status: 'received'
      });

      // Update status trong conversation
      const messageIndex = conversations[convKey].length - 1;
      conversations[convKey][messageIndex].status = 'received';
    }

    // Confirm cho sender
    socket.emit('message_sent', {
      tempId,
      messageId,
      timestamp: new Date().toISOString()
    });
  });

  // Xử lý typing indicator
  socket.on('typing', (data) => {
    const { recipientId } = data;
    const recipient = users[recipientId];

    if (recipient && recipient.status === 'online') {
      socket.to(recipient.socket_id).emit('user_typing', {
        senderId: user_id
      });
    }
  });

  // Xử lý mark as read
  socket.on('mark_as_read', (data) => {
    const { messageId, senderId } = data;

    // Tìm và update message trong conversation
    const convKey = getConversationKey(user_id, senderId);
    if (conversations[convKey]) {
      const message = conversations[convKey].find((m) => m.messageId === messageId);
      if (message) {
        message.status = 'read';

        // Notify sender
        const sender = users[senderId];
        if (sender && sender.status === 'online') {
          socket.to(sender.socket_id).emit('message_read', {
            messageId,
            readAt: new Date().toISOString()
          });
        }
      }
    }
  });

  // Xử lý disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', user_id);

    // Update status
    if (users[user_id]) {
      users[user_id].status = 'offline';
    }
  });

  // Legacy event handler (giữ lại để tương thích)
  socket.on('client_message', (data) => {
    console.log('message from client:', data);
    socket.emit('server_message', 'Server đã nhận được tin nhắn của bạn!');
  });
});

server.listen(PORT, () => {
  console.log(`Server Express + Socket.IO đang chạy chung trên cổng ${PORT}`);
  console.log(`→ REST API : http://localhost:${PORT}`);
  console.log(`→ Socket.IO: ws://localhost:${PORT}`);
});

app.use(cors());

initFolder();

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRoutes);
app.use('/static/videos', express.static(UPLOAD_VIDEO_DIRECTORY)); //này để phục vụ video tĩnh bên back, vì stream video thì cần range request nên phải có controller riêng để xử lý
app.use('/tweets', tweetsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/search', searchRouter);

databaseService
  .connect()
  .then(() => {
    databaseService.indexUser();
    databaseService.indexRefreshToken();
    databaseService.indexFollower();
    databaseService.indexVideoStatus();
    databaseService.indexTweets();
  })
  .catch(console.dir);

app.use(defaultErrorHandler);
