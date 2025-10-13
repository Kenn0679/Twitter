import { Router } from 'express';
import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  verifyEmailController
} from '~/controllers/users.controller';
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));

usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController));

usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController));

usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));

export default usersRouter;
