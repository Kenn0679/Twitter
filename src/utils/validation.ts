import express from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { EntityError, ErrorWithStatus } from '~/models/Errors';

// can be reused by many routes
const validate = (validations: RunnableValidationChains<ValidationChain>) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        await validations.run(req);
        const errors = validationResult(req);

        if (errors.isEmpty()) return next();

        const errorObj = errors.mapped();
        const entityError = new EntityError({ errors: {} });

        for (const key in errorObj) {
            const { msg } = errorObj[key];
            if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) return next(msg);
            entityError.errors[key] = errorObj[key];
        }

        next(entityError);
    };
};

export default validate;
