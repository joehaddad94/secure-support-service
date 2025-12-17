import { AIProviderResponse } from './types';
import { createProvider, getAvailableProviders } from './ProviderFactory';

export interface AnalyzeEmailOptions {
    primaryProvider?: string;
    email: string;
}

export async function analyzeEmail(
    options: AnalyzeEmailOptions
): Promise<AIProviderResponse> {
    const { primaryProvider, email } = options;
    
    const allProviders = getAvailableProviders();
    const fallbackOrder = primaryProvider
        ? [primaryProvider, ...allProviders.filter(p => p !== primaryProvider)]
        : allProviders;

    if (fallbackOrder.length === 0) {
        throw new Error('No AI providers available');
    }

    let lastError: Error | null = null;
    const attemptedProviders: string[] = [];

    for (const providerName of fallbackOrder) {
        attemptedProviders.push(providerName);
        
        try {
            const provider = createProvider(providerName);
            
            if (!provider.isAvailable()) {
                lastError = new Error(`Provider ${providerName} is not available`);
                continue;
            }

            const analysis = await provider.analyzeEmail(email);
            
            return {
                analysis,
                provider: provider.getName(),
                attemptedProviders,
            };
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            continue;
        }
    }

    throw new Error(
        `All providers failed. Attempted: ${attemptedProviders.join(', ')}. Last error: ${lastError?.message || 'unknown error'}`
    );
}

