import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';

//Record<string, string> => { [key: string]: string }
type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithStatus extends Error {
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    super(message);
    this.status = status;
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType;

  constructor({ errors }: { errors: ErrorsType }) {
    super({ message: USERS_MESSAGES.VALIDATION_ERROR, status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
    this.errors = errors;
  }
}
