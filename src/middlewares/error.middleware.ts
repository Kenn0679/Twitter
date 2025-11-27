import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      return res.status(err.status).json(omit(err, 'status'));
    }

    const finalError: { [key: string]: any } = {};

    Object.getOwnPropertyNames(err).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.configurable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable
      )
        return;
      finalError[key] = err[key];
    });

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: finalError.message,
      errorInfo: omit(finalError, 'stack')
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      errorInfo: omit(err, 'stack')
    });
  }
};

export default defaultErrorHandler;
