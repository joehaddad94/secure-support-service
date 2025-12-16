import { Request, Response } from 'express';
import { sanitizePII } from '../utils/piiSanitizer';
import { analyzeEmail } from '../services/ai/AIService';
import { createProvider } from '../services/ai/ProviderFactory';
import { config } from '../config/env';
import { analyzeEmailSchema } from '../validators/email.validator';

export async function analyzeEmailController(req: Request, res: Response) {
    try {
        const validation = analyzeEmailSchema.safeParse(req.body);
        
        if (!validation.success) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: validation.error.issues 
            });
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
        res.status(500).json({ error: error.message || 'Failed to analyze email' });
    }
}

