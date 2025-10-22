import { NextFunction, Request, RequestHandler, Response } from 'express';

const wrapRequestHandler = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    // Promise.resolve(func(req, res, next)).catch(next);
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

//mong muốn nhận vào Request<{username: string}>
//Thực nhận là Request<{[key: string]: string}>

export { wrapRequestHandler };
