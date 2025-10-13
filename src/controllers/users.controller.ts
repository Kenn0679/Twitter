import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import core from 'express-serve-static-core';
import {
  LoginRequestBody,
  LogoutRequestBody,
  RefreshTokenRequestBody,
  RegisterRequestBody,
  TokenPayload,
  VerifyEmailRequestBody
} from '~/models/requests/user.request';
import { ObjectId } from 'mongodb';
import User from '~/models/schemas/User.schemas';
import { USERS_MESSAGES } from '~/constants/messages';
import databaseService from '~/services/database.services';
import HTTP_STATUS from '~/constants/httpStatus';
import { UserVerifyStatus } from '~/constants/enums';

const loginController = async (req: Request<core.ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login(user_id.toString());
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
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

export {
  loginController,
  registerController,
  logoutController,
  refreshTokenController,
  verifyEmailController,
  resendVerifyEmailController
};
