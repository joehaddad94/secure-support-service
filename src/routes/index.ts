import { Router } from 'express';
import healthRoutes from './health.routes';
import emailRoutes from './email.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/', emailRoutes);

export default router;
