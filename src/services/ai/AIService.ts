import { AIProvider, AIProviderResponse } from './types';
import { createProvider, getAvailableProviders } from './ProviderFactory';

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
        attemptedProviders: [provider.getName()],
    };
}

export interface AnalyzeEmailWithFallbackOptions {
    primaryProvider?: string;
    email: string;
}

export async function analyzeEmailWithFallback(
    options: AnalyzeEmailWithFallbackOptions
): Promise<AIProviderResponse> {
    const { primaryProvider, email } = options;
    const allProviders = getAvailableProviders();
    const fallbackOrder = primaryProvider
        ? [primaryProvider, ...allProviders.filter(p => p !== primaryProvider)]
        : allProviders;

    let lastError: Error | null = null;
    
    for (const providerName of fallbackOrder) {
        try {
            const provider = createProvider(providerName);
            const result = await analyzeEmail(provider, email);
            
            return {
                ...result,
                attemptedProviders: fallbackOrder,
            };
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            continue;
        }
    }

    throw new Error(
        `All providers failed. Last error: ${lastError?.message || 'unknown error'}`
    );
}

