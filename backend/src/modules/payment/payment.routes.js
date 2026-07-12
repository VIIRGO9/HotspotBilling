import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import { recordPaymentSchema, verifyPaymentSchema, searchPaymentSchema } from './validators/payment.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'OPERATOR'), validate(recordPaymentSchema), audit('CREATE', 'PAYMENT'), PaymentController.record);
router.patch('/:id/verify', authorize('ADMIN', 'OPERATOR'), validate(verifyPaymentSchema), audit('VERIFY', 'PAYMENT'), PaymentController.verify);
router.get('/', validate(searchPaymentSchema), PaymentController.getAll);
router.get('/:id', PaymentController.getById);

export default router;
