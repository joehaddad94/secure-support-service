import { AIProvider } from './types';

const providers: Record<string, () => AIProvider> = {};

export function registerProvider(name: string, factory: () => AIProvider): void {
    providers[name.toLowerCase()] = factory;
}

export function createProvider(providerName: string): AIProvider {
    const name = providerName.toLowerCase();
    const factory = providers[name];
    
    if (!factory) {
        throw new Error(`Provider ${providerName} not found`);
    }
    
    return factory();
}

export function getAvailableProviders(): string[] {
    return Object.keys(providers);
}

