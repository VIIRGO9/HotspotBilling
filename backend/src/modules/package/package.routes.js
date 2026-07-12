import { Router } from 'express';
import { PackageController } from './package.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { audit } from '../../shared/middleware/audit.js';
import { createPackageSchema, updatePackageSchema, updateStatusSchema } from './validators/package.validator.js';

const router = Router();

router.get('/', PackageController.getAll);
router.get('/:id', PackageController.getById);

router.post('/', authenticate, authorize('ADMIN', 'OPERATOR'), validate(createPackageSchema), audit('CREATE', 'PACKAGE'), PackageController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'OPERATOR'), validate(updatePackageSchema), audit('UPDATE', 'PACKAGE'), PackageController.update);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'OPERATOR'), validate(updateStatusSchema), audit('UPDATE', 'PACKAGE_STATUS'), PackageController.updateStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), audit('DELETE', 'PACKAGE'), PackageController.delete);

export default router;
