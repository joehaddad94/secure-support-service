import { AIProvider, EmailAnalysis } from '../types';

function summarize(text: string): string {
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

async function analyzeEmail(email: string): Promise<EmailAnalysis> {
    const summary = summarize(email || '');
    return {
        intent: 'billing_issue',
        sentiment: 'neutral',
        summary,
        suggestedReply: 'Thanks for reaching out. We are reviewing your billing concern.',
        urgency: 'low',
    };
}

export const MockGeminiProvider: AIProvider = {
    getName: () => 'mock-gemini',
    isAvailable: () => true,
    analyzeEmail,
};

