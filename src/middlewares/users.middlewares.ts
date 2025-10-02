import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import userService from '~/services/users.services';
import validate from '~/utils/validation';

const loginValidator = (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
    }

    next();
};

const registerValidator = validate(
    checkSchema({
        name: {
            isString: true,
            isLength: {
                options: {
                    min: 1,
                    max: 100
                }
            },
            trim: true,
            errorMessage: 'Name is required and must be between 1 and 100 characters'
        },
        email: {
            notEmpty: true,
            isEmail: true,
            trim: true,
            errorMessage: 'Valid email is required',
            custom: {
                options: async (value) => {
                    const isExisted = await userService.checkEmailExist(value);

                    if (isExisted) {
                        throw new Error('Email already in use');
                    }

                    return true;
                }
            }
        },
        password: {
            notEmpty: true,
            isString: true,
            isLength: {
                options: { min: 6 }
            },
            errorMessage:
                'Password is required and must be at least 6 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                }
            }
        },
        confirmPassword: {
            notEmpty: true,
            isString: true,
            isLength: {
                options: { min: 6 }
            },
            errorMessage:
                'Confirm password is required and must be at least 6 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character',
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                }
            },
            custom: {
                options: (value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Confirm password does not match password');
                    }
                    return true;
                }
            }
        },
        dateOfBirth: {
            isISO8601: {
                options: {
                    strict: true,
                    strictSeparator: true
                }
            }
        }
    })
);

export { loginValidator, registerValidator };
