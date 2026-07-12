import { Router } from 'express';
import { SubscriptionController } from './subscription.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import { createSubscriptionSchema, getSubscriptionsSchema, subscriptionIdSchema } from './validators/subscription.validator.js';

const router = Router();

router.use(authenticate);

// Admin actions with audit
router.post('/', authorize('ADMIN', 'OPERATOR'), validate(createSubscriptionSchema), audit('CREATE', 'SUBSCRIPTION'), SubscriptionController.create);
router.patch('/:id/activate', authorize('ADMIN', 'OPERATOR'), validate(subscriptionIdSchema), audit('ACTIVATE', 'SUBSCRIPTION'), SubscriptionController.activate);
router.patch('/:id/cancel', authorize('ADMIN', 'OPERATOR'), validate(subscriptionIdSchema), audit('CANCEL', 'SUBSCRIPTION'), SubscriptionController.cancel);
router.patch('/:id/renew', authorize('ADMIN', 'OPERATOR'), validate(subscriptionIdSchema), audit('RENEW', 'SUBSCRIPTION'), SubscriptionController.renew);

// Read operations - no audit needed
router.get('/', validate(getSubscriptionsSchema), SubscriptionController.getAll);
router.get('/:id', validate(subscriptionIdSchema), SubscriptionController.getById);

export default router;
