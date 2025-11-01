import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import core from 'express-serve-static-core';
import {
  ChangePasswordRequestBody,
  FollowRequestBody,
  ForgotPasswordRequestBody,
  GetProfileRequestParams,
  LoginRequestBody,
  LogoutRequestBody,
  RefreshTokenRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UnfollowRequestParams,
  UpdateMeRequestBody,
  VerifyEmailRequestBody,
  VerifyForgotPasswordRequestBody
} from '~/models/requests/user.request';
import { ObjectId } from 'mongodb';
import User from '~/models/schemas/User.schema';
import { USERS_MESSAGES } from '~/constants/messages';
import databaseService from '~/services/database.services';
import HTTP_STATUS from '~/constants/httpStatus';
import { UserVerifyStatus } from '~/constants/enums';
import { config } from 'dotenv';
config();

const loginController = async (req: Request<core.ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify });
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query;
  const result = await usersService.oauth(code as string);
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.new_user}%&verify=${result.verify}`;
  return res.redirect(urlRedirect);
};

const registerController = async (req: Request<core.ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersService.register(req.body);
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
};

const logoutController = async (req: Request<core.ParamsDictionary, any, LogoutRequestBody>, res: Response) => {
  const { refresh_token } = req.body;
  await usersService.logout(refresh_token);
  return res.json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS
  });
};

const refreshTokenController = async (
  req: Request<core.ParamsDictionary, any, RefreshTokenRequestBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload;
  const result = await usersService.refreshToken({ user_id, verify, refresh_token });

  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  });
};

const verifyEmailController = async (
  req: Request<core.ParamsDictionary, any, VerifyEmailRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });

  if (!user) {
    return res.status(HTTP_STATUS.USER_NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }

  if (user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }

  const result = await usersService.verifyEmail(user_id);
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY,
    result
  });
};

const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });

  if (!user) {
    return res.status(HTTP_STATUS.USER_NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED
    });
  }

  const result = await usersService.resendVerifyEmail(user_id);
  return res.json(result);
};

const forgotPasswordController = async (
  req: Request<core.ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User;

  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify: verify
  });

  return res.json({ result });
};

const verifyForgotPasswordTokenController = async (
  req: Request<core.ParamsDictionary, any, VerifyForgotPasswordRequestBody>,
  res: Response
) => {
  return res.json({ message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS });
};

const resetPasswordController = async (
  req: Request<core.ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload;
  const { password } = req.body;
  const result = await usersService.resetPassword(user_id, password);
  return res.json(result);
};

const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;

  const user = await usersService.getMe(user_id);
  return res.json({ message: USERS_MESSAGES.GET_ME_SUCCESS, user });
};

const updateMeController = async (req: Request<core.ParamsDictionary, any, UpdateMeRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { body } = req;

  const updatedUser = await usersService.updateMe(user_id, body);
  return res.json({
    message: USERS_MESSAGES.PROFILE_UPDATED_SUCCESSFULLY,
    result: updatedUser
  });
};

const getProfileController = async (req: Request<GetProfileRequestParams>, res: Response) => {
  const { username } = req.params;

  const user = await usersService.getProfile(username);
  return res.json({ message: USERS_MESSAGES.GET_PROFILE_SUCCESS, user });
};

const followController = async (req: Request<core.ParamsDictionary, any, FollowRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.body;
  const result = await usersService.follow(user_id, followed_user_id);
  return res.json(result);
};

const unfollowController = async (req: Request<UnfollowRequestParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { user_id: followed_user_id } = req.params;
  const result = await usersService.unfollow(user_id, followed_user_id);
  return res.json(result);
};

const changePasswordController = async (
  req: Request<core.ParamsDictionary, any, ChangePasswordRequestBody>,
  res: Response
) => {
  const { user_id } = (req as Request).decoded_authorization as TokenPayload;
  const { password } = req.body;

  const result = await usersService.changePassword(user_id, password);
  return res.json(result);
};

export {
  loginController,
  registerController,
  logoutController,
  refreshTokenController,
  verifyEmailController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordTokenController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getProfileController,
  followController,
  unfollowController,
  changePasswordController,
  oauthController
};
