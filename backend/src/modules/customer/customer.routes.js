import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import { createCustomerSchema, updateCustomerSchema, updateCustomerStatusSchema, searchCustomerSchema } from './validators/customer.validator.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'OPERATOR'));

router.post('/', validate(createCustomerSchema), audit('CREATE', 'CUSTOMER'), CustomerController.create);
router.get('/', validate(searchCustomerSchema), CustomerController.getAll);
router.get('/:id', CustomerController.getById);
router.put('/:id', validate(updateCustomerSchema), audit('UPDATE', 'CUSTOMER'), CustomerController.update);
router.patch('/:id/status', validate(updateCustomerStatusSchema), audit('UPDATE', 'CUSTOMER_STATUS'), CustomerController.updateStatus);
router.delete('/:id', audit('DELETE', 'CUSTOMER'), CustomerController.delete);

export default router;
