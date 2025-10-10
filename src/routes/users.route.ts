import { Router } from 'express';
import { loginController, registerController } from '~/controllers/users.controller';
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const usersRouter = Router();

usersRouter.post('/login', loginValidator, loginController, (req, res) => {
    res.json({
        message: 'Login successful'
    });
});

/**
 * Desction: User Registration Route
 * method: POST
 * endpoint: /users/register
 * {name: string, email: string, password: string, date_of_birth: Date }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

export default usersRouter;
