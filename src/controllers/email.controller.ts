import { Request, Response, NextFunction } from 'express';
import { sanitizePII } from '../utils/piiSanitizer';
import { analyzeEmailWithFallback } from '../services/ai/AIService';
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
        const sanitized = sanitizePII(email);
        const primaryProvider = (req.headers['x-ai-provider'] as string) || config.aiProvider;

        const result = await analyzeEmailWithFallback({
            primaryProvider,
            email: sanitized.sanitizedText,
        });

        return res.json({
            analysis: result.analysis,
            provider: result.provider,
            redactions: sanitized.redactions,
            attemptedProviders: result.attemptedProviders,
        });
    } catch (error: any) {
        const err: AppError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error.message?.includes('All providers failed')) {
            err.statusCode = 502;
            (err as any).details = { message: error.message };
        } else {
            err.statusCode = err.statusCode || 500;
        }
        
        return next(err);
    }
}

