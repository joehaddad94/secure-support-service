import { z } from 'zod';

export const emailAnalysisSchema = z.object({
    intent: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    summary: z.string(),
    suggestedReply: z.string(),
    urgency: z.enum(['low', 'medium', 'high']),
});

export type EmailAnalysisValidated = z.infer<typeof emailAnalysisSchema>;

