import { AIProvider, EmailAnalysis } from '../types';

function summarize(text: string): string {
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

async function analyzeEmail(email: string): Promise<EmailAnalysis> {
    const summary = summarize(email || '');
    return {
        intent: 'general_support',
        sentiment: 'neutral',
        summary,
        suggestedReply: 'We received your request and will get back to you shortly.',
        urgency: 'medium',
    };
}

export const MockAnthropicProvider: AIProvider = {
    getName: () => 'mock-anthropic',
    isAvailable: () => true,
    analyzeEmail,
};

