import { Request, Response, NextFunction } from 'express';
import { sanitizePII } from '../utils/piiSanitizer';
import { analyzeEmail } from '../services/ai/AIService';
import { createProvider, getAvailableProviders } from '../services/ai/ProviderFactory';
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
        const primary = (req.headers['x-ai-provider'] as string) || config.aiProvider;
        const all = getAvailableProviders();
        const fallbackOrder = [primary, ...all.filter(p => p !== primary)];

        let lastError: any = null;
        for (const name of fallbackOrder) {
            try {
                const provider = createProvider(name);
                const result = await analyzeEmail(provider, sanitized.sanitizedText);

                return res.json({
                    analysis: result.analysis,
                    provider: result.provider,
                    redactions: sanitized.redactions,
                    attemptedProviders: fallbackOrder,
                });
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        const err: AppError = new Error('All providers failed');
        err.statusCode = 502;
        (err as any).details = { lastError: lastError?.message || 'unknown error' };
        return next(err);
    } catch (error: any) {
        next(error);
    }
}

