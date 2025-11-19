import { Router } from 'express';
import { searchController } from '~/controllers/search.controller';
import { searchValidator } from '~/middlewares/search.middleware';
import { paginationValidator } from '~/middlewares/tweets.middleware';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
const searchRouter = Router();

searchRouter.get(
  '/',
  accessTokenValidator,
  searchValidator,
  paginationValidator,
  verifiedUserValidator,
  searchController
);

export default searchRouter;
