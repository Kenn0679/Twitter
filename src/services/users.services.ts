import User from '~/models/Schemas/User.schema';
import databaseService from './database.services';
import { RegisterRequestBody, UpdateMeRequestBody } from '~/models/requests/user.request';
import { generateRandomPassword, hashPassword } from '~/utils/crypto';
import { signToken, verifyToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import RefreshToken from '~/models/Schemas/RefreshToken.schema';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import Follower from '~/models/Schemas/Follower.schema';
import axios from 'axios';
import { StringValue } from 'ms';
import { sendVerifyEmail } from '~/utils/email';
import { renderEmailTemplate } from '~/utils/handlebarsEmail';

dotenv.config();

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ACCESS_TOKEN, verify },
      privateKey: process.env.JWT_ACCESS_SECRET as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE as any }
    });
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.REFRESH_TOKEN,
          verify,
          exp: Math.floor(exp)
        },
        privateKey: process.env.JWT_REFRESH_SECRET as string
      });
    }
    return signToken({
      payload: { user_id, token_type: TokenType.REFRESH_TOKEN, verify },
      privateKey: process.env.JWT_REFRESH_SECRET as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE as StringValue }
    });
  }

  private signToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EMAIL_VERIFY_TOKEN, verify },
      privateKey: process.env.JWT_EMAIL_SECRET as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE as any }
    });
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.FORGOT_PASSWORD_TOKEN, verify },
      privateKey: process.env.JWT_FORGOT_PASSWORD_SECRET as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE as any }
    });
  }

  private async decodedRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_REFRESH_SECRET as string
    });
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    refresh_token: string;
    exp: number;
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp })
    ]);

    const decoded_refresh_token = await this.decodedRefreshToken(new_refresh_token);
    databaseService.refreshTokens.deleteOne({ token: refresh_token });
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: new_refresh_token,
        user_id: new ObjectId(user_id),
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    );

    return { access_token: new_access_token, refresh_token: new_refresh_token };
  }

  async register(payload: RegisterRequestBody, verifyStatus: UserVerifyStatus = UserVerifyStatus.Unverified) {
    const user_id = new ObjectId();

    let email_verify_token = '';
    if (verifyStatus === UserVerifyStatus.Unverified) {
      email_verify_token = await this.signEmailVerifyToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Unverified
      });

      await sendVerifyEmail(
        payload.email,
        'Verify your email address',
        renderEmailTemplate('verify-email', email_verify_token)
      );
    }

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        verify: verifyStatus
      })
    );

    const [access_token, refresh_token] = await this.signToken({
      user_id: user_id.toString(),
      verify: verifyStatus
    });

    const { iat, exp } = await this.decodedRefreshToken(refresh_token);

    databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id), iat, exp })
    );

    return { access_token, refresh_token };
  }

  async checkEmailExist(email: string) {
    const existed = await databaseService.users.findOne({ email: email });
    return Boolean(existed);
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signToken({ user_id, verify });

    const { iat, exp } = await this.decodedRefreshToken(refresh_token);
    databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id), iat, exp })
    );

    return { access_token, refresh_token };
  }

  private async getGoogleOAuthToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return data as {
      access_token: string;
      id_token: string;
    };
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });

    return data as {
      email: string;
      verified_email: boolean;
      name: string;
      picture: string;
      given_name: string;
      family_name: string;
    };
  }

  async oauth(code: string) {
    const { id_token, access_token } = await this.getGoogleOAuthToken(code);
    const userInfo = await this.getGoogleUserInfo(access_token, id_token);

    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GOOGLE_EMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    const user = await databaseService.users.findOne({
      email: userInfo.email
    });

    if (user) {
      const [access_token, refresh_token] = await this.signToken({ user_id: user._id.toString(), verify: user.verify });

      const { iat, exp } = await this.decodedRefreshToken(refresh_token);
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ token: refresh_token, user_id: new ObjectId(user._id.toString()), iat, exp })
      );
      return {
        access_token,
        refresh_token,
        new_user: false,
        verify: user.verify
      };
    } else {
      const password = generateRandomPassword;

      const data = await this.register(
        {
          email: userInfo.email,
          name: userInfo.name,
          date_of_birth: new Date().toISOString(),
          password,
          confirm_password: password
        },
        UserVerifyStatus.Verified
      );

      return { ...data, new_user: true, verify: UserVerifyStatus.Verified };
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    return {
      success: true,
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            updated_at: '$$NOW', // new Date(), new Date diễn ra khi gọi hàm, $$NOW diễn ra trong db
            verify: UserVerifyStatus.Verified
          }
          // $currentDate: { updated_at: true } cũng tạo một ngày nhưng gọi trong lúc update DB chứ không phải khi gọi hàm verifyEmail
        }
      ])
    ]);

    const [access_token, refresh_token] = tokens;

    const { iat, exp } = await this.decodedRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id), iat, exp })
    );

    return {
      access_token,
      refresh_token
    };
  }

  async resendVerifyEmail(user_id: string, user_email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });

    await sendVerifyEmail(
      user_email,
      'Verify your email address',
      renderEmailTemplate('verify-email', email_verify_token)
    );

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token,
          verify: UserVerifyStatus.Unverified
        },
        $currentDate: { updated_at: true }
      }
    );

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  async forgotPassword({
    user_id,
    verify,
    user_email
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    user_email: string;
  }) {
    const forgotPasswordToken = await this.signForgotPasswordToken({ user_id, verify });
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: forgotPasswordToken
        },
        $currentDate: { updated_at: true }
      }
    );

    await sendVerifyEmail(
      user_email,
      'Forgot your password?',
      renderEmailTemplate('reset-password', forgotPasswordToken)
    );

    return {
      message: USERS_MESSAGES.FORGOT_PASSWORD_EMAIL_SENT_SUCCESSFULLY
    };
  }

  async resetPassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(new_password)
        },
        $currentDate: { updated_at: true }
      }
    );

    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return user;
  }
  async updateMe(user_id: string, payload: UpdateMeRequestBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload;
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateMeRequestBody & { date_of_birth?: Date })
        },
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return user;
  }

  async getOtherUser(current_user_id: string, target_user_id?: string) {
    // Nếu có target_user_id, lấy user đó
    if (target_user_id) {
      const user = await databaseService.users.findOne(
        { _id: new ObjectId(target_user_id) },
        {
          projection: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0
          }
        }
      );
      return user;
    }

    // Nếu không có, lấy một user khác với current user (user đầu tiên khác)
    const user = await databaseService.users.findOne(
      { _id: { $ne: new ObjectId(current_user_id) } },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return user;
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    );

    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.USER_NOT_FOUND
      });
    }
    return user;
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    if (follower) {
      return {
        message: USERS_MESSAGES.FOLLOW_USER_ALREADY_FOLLOWING
      };
    }

    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id),
        created_at: new Date()
      })
    );

    return {
      message: USERS_MESSAGES.FOLLOW_USER_SUCCESS
    };
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    if (!follower) {
      return {
        message: USERS_MESSAGES.FOLLOW_USER_NOT_FOLLOWING
      };
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    return {
      message: USERS_MESSAGES.UNFOLLOW_USER_SUCCESS
    };
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: { updated_at: true }
      }
    );

    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    };
  }
}

const usersService = new UsersService();
export default usersService;
