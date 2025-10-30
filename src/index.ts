import defaultErrorHandler from './middlewares/error.middleware';
import express from 'express';
import usersRouter from './routes/users.route';
import databaseService from './services/database.services';
import dotenv from 'dotenv';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/File';
import staticRoutes from './routes/static.routes';
import { UPLOAD_VIDEO_DIRECTORY } from './constants/dir';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

initFolder();

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRoutes);
app.use('/static/videos', express.static(UPLOAD_VIDEO_DIRECTORY)); //này để phục vụ video tĩnh bên back, vì stream video thì cần range request nên phải có controller riêng để xử lý

databaseService.connect().catch(console.dir);

app.use(defaultErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
