import { Router } from 'express';
import { createBookmarkController } from '~/controllers/bookmark.controller';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarksRouter = Router();

bookmarksRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createBookmarkController));

export default bookmarksRouter;
