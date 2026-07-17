import { Router } from 'express';
import { RouterController } from './router.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import {
  createRouterSchema,
  updateRouterSchema,
  updateRouterStatusSchema,
  searchRouterSchema
} from './validators/router.validator.js';

const router = Router();

// All routes in this file require authentication and Admin role
router.use(authenticate, authorize('ADMIN'));

router.post('/', validate(createRouterSchema), audit('CREATE', 'ROUTER'), RouterController.create);
router.get('/', validate(searchRouterSchema), RouterController.getAll);
router.get('/:id', RouterController.getById);
router.put('/:id', validate(updateRouterSchema), audit('UPDATE', 'ROUTER'), RouterController.update);
router.patch('/:id/status', validate(updateRouterStatusSchema), audit('UPDATE', 'ROUTER_STATUS'), RouterController.updateStatus);
router.delete('/:id', audit('DELETE', 'ROUTER'), RouterController.delete);

// New routes for Archive management and testing
router.patch('/:id/restore', audit('RESTORE', 'ROUTER'), RouterController.restore);
router.delete('/:id/permanent', audit('DELETE_PERMANENT', 'ROUTER'), RouterController.permanentDelete);
router.post('/:id/test-connection', RouterController.testConnection);

export default router;