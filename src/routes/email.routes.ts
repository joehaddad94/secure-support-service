import { Router } from 'express';
import { analyzeEmailController } from '../controllers/email.controller';
import '../services/ai/providers';

const router = Router();

router.post('/analyze-email', analyzeEmailController);

export default router;

