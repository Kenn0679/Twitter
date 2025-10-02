import express from 'express';
import usersRouter from './routes/users.route';
import databaseService from './services/database.services';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use('/users', usersRouter);

databaseService.connect().catch(console.dir);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
