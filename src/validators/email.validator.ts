import { z } from 'zod';

export const analyzeEmailSchema = z.object({
    email: z.string().min(1, 'Email content is required'),
});

export type AnalyzeEmailRequest = z.infer<typeof analyzeEmailSchema>;

