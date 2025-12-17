export interface EmailAnalysis {
    intent: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
    suggestedReply: string;
    urgency: 'low' | 'medium' | 'high';
}

export interface AIProviderResponse {
    analysis: EmailAnalysis;
    provider: string;
    attemptedProviders: string[];
}

export interface AIProvider {
    analyzeEmail(sanitizedEmail: string): Promise<EmailAnalysis>;
    getName(): string;
    isAvailable(): boolean;
}

