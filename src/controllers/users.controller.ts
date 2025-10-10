import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import core from 'express-serve-static-core';
import { RegisterRequestBody } from '~/models/requests/user.request';

const loginController = (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (email === 'toibingu' && password === '12345') {
        return res.status(200).json({ message: 'Login successful' });
    }

    return res.status(400).json({ message: 'Invalid email or password' });
};

const registerController = async (req: Request<core.ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
    const result = await usersService.register(req.body);
    return res.json({
        message: 'Register successfully',
        result
    });
};
export { loginController, registerController };
