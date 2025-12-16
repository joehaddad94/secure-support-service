import { AIProvider, AIProviderResponse } from './types';

export async function analyzeEmail(
    provider: AIProvider,
    email: string
): Promise<AIProviderResponse> {
    if (!provider.isAvailable()) {
        throw new Error('Provider not available');
    }

    const analysis = await provider.analyzeEmail(email);

    return {
        analysis,
        provider: provider.getName(),
    };
}

