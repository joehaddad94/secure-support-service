import { Request, Response, NextFunction } from 'express';
import { sanitizePII } from '../utils/piiSanitizer';
import { analyzeEmail } from '../services/ai/AIService';
import { createProvider } from '../services/ai/ProviderFactory';
import { config } from '../config/env';
import { analyzeEmailSchema } from '../validators/email.validator';
import { AppError } from '../middleware/errorHandler';

export async function analyzeEmailController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validation = analyzeEmailSchema.safeParse(req.body);
        
        if (!validation.success) {
            const err: AppError = new Error('Validation failed');
            err.statusCode = 400;
            (err as any).details = validation.error.issues;
            return next(err);
        }

        const { email } = validation.data;
        const providerName = req.headers['x-ai-provider'] as string || config.aiProvider;
        const provider = createProvider(providerName);

        const sanitized = sanitizePII(email);
        const result = await analyzeEmail(provider, sanitized.sanitizedText);

        res.json({
            analysis: result.analysis,
            provider: result.provider,
            redactions: sanitized.redactions,
        });
    } catch (error: any) {
        next(error);
    }
}

