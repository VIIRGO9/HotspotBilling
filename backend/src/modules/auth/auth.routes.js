import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { audit } from '../../shared/middleware/audit.js';
import { registerSchema, loginSchema } from './validators/auth.validator.js';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [ADMIN, OPERATOR, CUSTOMER] }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error }
 *       409: { description: Email already exists }
 */


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and retrieve JWT
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Login successful, returns JWT }
 *       401: { description: Invalid credentials }
 */




router.post('/register', validate(registerSchema), audit('CREATE', 'USER'), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login); 

export default router;

