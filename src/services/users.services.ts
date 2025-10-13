import User from '~/models/schemas/User.schemas';
import databaseService from './database.services';
import { RegisterRequestBody } from '~/models/requests/user.request';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import { USERS_MESSAGES } from '~/constants/messages';

dotenv.config();

class UsersService {
  private signAccessToken(user_id: string, verify: UserVerifyStatus) {
    return signToken({
      payload: { user_id, token_type: TokenType.ACCESS_TOKEN, verify },
      privateKey: process.env.JWT_ACCESS_SECRET as string,
      options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE as any }
    });
  }

  private signRefreshToken(user_id: string, verify: UserVerifyStatus) {
    return signToken({
      payload: { user_id, token_type: TokenType.REFRESH_TOKEN, verify },
      privateKey: process.env.JWT_REFRESH_SECRET as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE as any }
    });
  }

  private signToken(user_id: string, verify: UserVerifyStatus) {
    return Promise.all([this.signAccessToken(user_id, verify), this.signRefreshToken(user_id, verify)]);
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EMAIL_VERIFY_TOKEN },
      privateKey: process.env.JWT_EMAIL_SECRET as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE as any }
    });
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    refresh_token: string;
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken(user_id, verify),
      this.signRefreshToken(user_id, verify),
      databaseService.refreshTokens.deleteOne({ token: refresh_token }),
      databaseService.refreshTokens.insertOne(
        new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id) })
      )
    ]);

    return { access_token: new_access_token, refresh_token: new_refresh_token };
  }

  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString());

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    );

    const [access_token, refresh_token] = await this.signToken(user_id.toString(), UserVerifyStatus.Verified);

    databaseService.refreshTokens.insertOne(new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id) }));

    return { access_token, refresh_token };
  }

  async checkEmailExist(email: string) {
    const existed = await databaseService.users.findOne({ email: email });
    return Boolean(existed);
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signToken(user_id, UserVerifyStatus.Verified);

    databaseService.refreshTokens.insertOne(new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id) }));

    return { access_token, refresh_token };
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
      this.signToken(user_id, UserVerifyStatus.Verified),
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

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id) })
    );

    return {
      access_token,
      refresh_token
    };
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id);
    console.log('resend verify email ne hihi: ', email_verify_token);

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: { updated_at: true }
      }
    );

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }
}

const usersService = new UsersService();
export default usersService;
