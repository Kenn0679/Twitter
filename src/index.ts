import defaultErrorHandler from './middlewares/error.middleware';
import express from 'express';
import usersRouter from './routes/users.route';
import databaseService from './services/database.services';
import dotenv from 'dotenv';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/File';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

initFolder();

app.use(express.json());
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);

databaseService.connect().catch(console.dir);

app.use(defaultErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
