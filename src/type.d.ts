// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express';
import User from '~/models/schemas/User.schemas';
import { TokenPayload } from './models/requests/user.request';
declare module 'express' {
  interface Request {
    user?: User;
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    decoded_email_verify_token?: TokenPayload;
  }
}
