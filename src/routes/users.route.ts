import { Router } from 'express';
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  getOtherUserController,
  getProfileController,
  loginController,
  logoutController,
  oauthController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controller';
import { filterMiddleware } from '~/middlewares/common.middleware';
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  forgotPasswordValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares';
import { UpdateMeRequestBody } from '~/models/requests/user.request';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController));

usersRouter.get('/oauth/google', wrapRequestHandler(oauthController));

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));

usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController));

usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController));

usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));

usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));

usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordTokenController)
);

usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController));

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

usersRouter.get('/other', accessTokenValidator, wrapRequestHandler(getOtherUserController));

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeRequestBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
);

usersRouter.get('/:username', wrapRequestHandler(getProfileController));

usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
);

usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
);

usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
);

export default usersRouter;
