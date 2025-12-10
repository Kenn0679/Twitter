import defaultErrorHandler from './middlewares/error.middleware';
import express from 'express';
import usersRouter from './routes/users.route';
import databaseService from './services/database.services';
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
import { initializeSocket } from './socket/socket';
import conversationsRoutes from './routes/conversations.routes';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import envConfig from './utils/envConfig';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'X clone (Twitter API)',
      version: '1.0.0'
    }
  },
  apis: ['./openapi/*.yaml']
};
const openapiSpecification = swaggerJsdoc(options);

const app = express();
const PORT = envConfig.port;

const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible in routes if needed
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server Express + Socket.IO đang chạy chung trên cổng ${PORT}`);
  console.log(`→ REST API : http://localhost:${PORT}`);
  console.log(`→ Socket.IO: ws://localhost:${PORT}`);
});

app.use(cors());

initFolder();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRoutes);
app.use('/static/videos', express.static(UPLOAD_VIDEO_DIRECTORY)); //này để phục vụ video tĩnh bên back, vì stream video thì cần range request nên phải có controller riêng để xử lý
app.use('/tweets', tweetsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/search', searchRouter);
app.use('/conversations', conversationsRoutes);

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
