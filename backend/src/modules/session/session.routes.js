import { Router } from 'express';
import { SessionController } from './session.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import { startSessionSchema, stopSessionSchema, searchSessionSchema } from './validators/session.validator.js';

const router = Router();

// ==========================================
// Public Routes (For Captive Portal Users)
// ==========================================

// Allows a voucher user to disconnect themselves. 
// Security relies on the session ID being a hard-to-guess UUID.
router.post('/:id/stop', validate(stopSessionSchema), SessionController.stop);


// ==========================================
// Protected Routes (Admin/Operator Only)
// ==========================================

router.post(
    '/start',
    authenticate,
    validate(startSessionSchema),
    audit('START', 'SESSION'),
    SessionController.start
);

router.get(
    '/active/count',
    authenticate,
    SessionController.getActiveCount
);

router.get(
    '/',
    authenticate,
    validate(searchSessionSchema),
    SessionController.getAll
);

router.get(
    '/:id',
    authenticate,
    SessionController.getById
);

export default router;