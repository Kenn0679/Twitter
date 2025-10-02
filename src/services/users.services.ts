import User from '~/models/Schemas/User.schemas';
import databaseService from './database.services';
import { RegisterRequestBody } from '~/models/Schemas/request/user.request';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enums';
import dotenv from 'dotenv';

dotenv.config();

class UsersService {
    private signAccessToken(user_id: string) {
        return signToken({
            payload: { user_id, token_type: TokenType.ACCESS_TOKEN },
            options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE as any }
        });
    }

    private signRefreshToken(user_id: string) {
        return signToken({
            payload: { user_id, token_type: TokenType.REFRESH_TOKEN },
            options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE as any }
        });
    }
    async register(payload: RegisterRequestBody) {
        const result = await databaseService.users.insertOne(
            new User({
                ...payload,
                date_of_birth: new Date(payload.date_of_birth),
                password: hashPassword(payload.password)
            })
        );

        const user_id = result.insertedId.toString();
        const [access_token, refresh_token] = await Promise.all([
            this.signAccessToken(user_id),
            this.signRefreshToken(user_id)
        ]);

        return { access_token, refresh_token };
    }

    async checkEmailExist(email: string) {
        const existed = await databaseService.users.findOne({ email: email });
        return Boolean(existed);
    }
}

const usersService = new UsersService();
export default usersService;
