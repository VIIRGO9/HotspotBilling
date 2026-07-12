import { Router } from 'express';
import { VoucherController } from './voucher.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import { generateVoucherSchema, validateVoucherSchema, getVoucherSchema, cancelVoucherSchema } from './validators/voucher.validator.js';

const router = Router();

// Public route - NO audit (high volume, no user context)
router.post('/validate', validate(validateVoucherSchema), VoucherController.validate);

// Protected routes with audit
router.post('/generate', authenticate, authorize('ADMIN', 'OPERATOR'), validate(generateVoucherSchema), audit('CREATE', 'VOUCHER_BATCH'), VoucherController.generate);
router.get('/', authenticate, authorize('ADMIN', 'OPERATOR'), VoucherController.getAll);
router.get('/:code', authenticate, authorize('ADMIN', 'OPERATOR'), validate(getVoucherSchema), VoucherController.getByCode);
router.patch('/:id/cancel', authenticate, authorize('ADMIN', 'OPERATOR'), validate(cancelVoucherSchema), audit('CANCEL', 'VOUCHER'), VoucherController.cancel);

export default router;
