import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';
import HTTP_STATUS from '~/constants/httpStatus';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(omit(err, 'status'));
};

export default defaultErrorHandler;
