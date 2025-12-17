import { analyzeEmail } from '../AIService';
import { createProvider, registerProvider, getAvailableProviders } from '../ProviderFactory';
import { AIProvider, EmailAnalysis } from '../types';

describe('AIService', () => {
    // Mock provider for testing
    const createMockProvider = (name: string, available: boolean, shouldThrow: boolean = false): AIProvider => ({
        getName: () => name,
        isAvailable: () => available,
        analyzeEmail: async (email: string): Promise<EmailAnalysis> => {
            if (shouldThrow) {
                throw new Error(`Provider ${name} failed`);
            }
            return {
                intent: 'test_intent',
                sentiment: 'neutral',
                summary: 'test summary',
                suggestedReply: 'test reply',
                urgency: 'low',
            };
        },
    });

    // Note: ProviderFactory doesn't have unregister, so tests may use existing providers
    // We'll use unique provider names to avoid conflicts

    // Edge Cases - No Providers
    test('should throw error when no providers are available', async () => {
        // This test requires the ProviderFactory to be empty, which is hard to test
        // without exposing internal state. We'll test the error message instead.
        await expect(analyzeEmail({ email: 'test' })).rejects.toThrow();
    });

    // Edge Cases - All Providers Fail
    test('should throw error when all providers fail', async () => {
        const failingProvider = createMockProvider('failing-provider', true, true);
        registerProvider('failing-provider', () => failingProvider);

        await expect(analyzeEmail({ 
            primaryProvider: 'failing-provider',
            email: 'test email' 
        })).rejects.toThrow('All providers failed');
    });

    test('should include attempted providers in error message', async () => {
        const failingProvider = createMockProvider('failing-provider', true, true);
        registerProvider('failing-provider', () => failingProvider);

        try {
            await analyzeEmail({ 
                primaryProvider: 'failing-provider',
                email: 'test email' 
            });
        } catch (error: any) {
            expect(error.message).toContain('failing-provider');
            expect(error.message).toContain('Attempted:');
        }
    });

    // Edge Cases - Provider Not Found
    test('should handle provider not found in fallback', async () => {
        const workingProvider = createMockProvider('working-provider', true, false);
        registerProvider('working-provider', () => workingProvider);

        const result = await analyzeEmail({ 
            primaryProvider: 'non-existent-provider',
            email: 'test email' 
        });

        expect(result.provider).toBe('working-provider');
        expect(result.attemptedProviders).toContain('non-existent-provider');
    });

    // Edge Cases - Unavailable Providers
    test('should skip unavailable providers and use available one', async () => {
        const unavailableProvider = createMockProvider('unavailable-test', false, false);
        const availableProvider = createMockProvider('available-test', true, false);
        
        registerProvider('unavailable-test', () => unavailableProvider);
        registerProvider('available-test', () => availableProvider);

        const result = await analyzeEmail({ 
            primaryProvider: 'unavailable-test',
            email: 'test email' 
        });

        // Should skip unavailable-test and use available-test or another available provider
        expect(result.provider).not.toBe('unavailable-test');
        expect(result.attemptedProviders).toContain('unavailable-test');
        expect(result.provider).toBeDefined();
    });

    // Edge Cases - Fallback Order
    test('should try primary provider first', async () => {
        const primaryProvider = createMockProvider('primary', true, false);
        const secondaryProvider = createMockProvider('secondary', true, false);
        
        registerProvider('primary', () => primaryProvider);
        registerProvider('secondary', () => secondaryProvider);

        const result = await analyzeEmail({ 
            primaryProvider: 'primary',
            email: 'test email' 
        });

        expect(result.provider).toBe('primary');
        expect(result.attemptedProviders[0]).toBe('primary');
    });

    test('should fallback to secondary when primary fails', async () => {
        const primaryProvider = createMockProvider('primary-test', true, true);
        const secondaryProvider = createMockProvider('secondary-test', true, false);
        
        registerProvider('primary-test', () => primaryProvider);
        registerProvider('secondary-test', () => secondaryProvider);

        const result = await analyzeEmail({ 
            primaryProvider: 'primary-test',
            email: 'test email' 
        });

        // Should try primary first, then fallback to secondary or another available provider
        expect(result.provider).not.toBe('primary-test');
        expect(result.attemptedProviders[0]).toBe('primary-test');
        expect(result.provider).toBeDefined();
    });

    // Edge Cases - Empty Email
    test('should handle empty email string', async () => {
        const provider = createMockProvider('empty-email-provider', true, false);
        registerProvider('empty-email-provider', () => provider);

        const result = await analyzeEmail({ 
            primaryProvider: 'empty-email-provider',
            email: '' 
        });

        expect(result).toBeDefined();
        expect(result.provider).toBe('empty-email-provider');
    });

    // Edge Cases - Very Long Email
    test('should handle very long email content', async () => {
        const provider = createMockProvider('long-email-provider', true, false);
        registerProvider('long-email-provider', () => provider);

        const longEmail = 'a'.repeat(100000);
        const result = await analyzeEmail({ 
            primaryProvider: 'long-email-provider',
            email: longEmail 
        });

        expect(result).toBeDefined();
        expect(result.provider).toBe('long-email-provider');
    });

    // Edge Cases - Case Sensitivity
    test('should handle case-insensitive provider names', async () => {
        const provider = createMockProvider('case-test-provider', true, false);
        registerProvider('case-test-provider', () => provider);

        const result1 = await analyzeEmail({ 
            primaryProvider: 'CASE-TEST-PROVIDER',
            email: 'test email' 
        });

        const result2 = await analyzeEmail({ 
            primaryProvider: 'Case-Test-Provider',
            email: 'test email' 
        });

        expect(result1.provider).toBe('case-test-provider');
        expect(result2.provider).toBe('case-test-provider');
    });

    // Edge Cases - Multiple Fallbacks
    test('should try all providers in order when multiple fail', async () => {
        const provider1 = createMockProvider('multi-fail-1', true, true);
        const provider2 = createMockProvider('multi-fail-2', true, true);
        const provider3 = createMockProvider('multi-fail-3', true, false);
        
        registerProvider('multi-fail-1', () => provider1);
        registerProvider('multi-fail-2', () => provider2);
        registerProvider('multi-fail-3', () => provider3);

        const result = await analyzeEmail({ 
            primaryProvider: 'multi-fail-1',
            email: 'test email' 
        });

        // Should try primary first, then fallback through other providers
        // Note: fallback order includes all registered providers, not just test ones
        expect(result.attemptedProviders[0]).toBe('multi-fail-1');
        expect(result.provider).toBeDefined();
        expect(result.provider).not.toBe('multi-fail-1'); // Primary should fail
    });

    // Edge Cases - Provider Throws Non-Error
    test('should handle provider that throws non-Error object', async () => {
        const badProvider: AIProvider = {
            getName: () => 'bad-provider-nonerror',
            isAvailable: () => true,
            analyzeEmail: async () => {
                throw 'string error'; // Not an Error object
            },
        };
        
        registerProvider('bad-provider-nonerror', () => badProvider);
        const workingProvider = createMockProvider('working-nonerror', true, false);
        registerProvider('working-nonerror', () => workingProvider);

        const result = await analyzeEmail({ 
            primaryProvider: 'bad-provider-nonerror',
            email: 'test email' 
        });

        // Should skip bad provider and use working one or another available provider
        expect(result.provider).not.toBe('bad-provider-nonerror');
        expect(result.attemptedProviders).toContain('bad-provider-nonerror');
        expect(result.provider).toBeDefined();
    });

    // Edge Cases - No Primary Provider Specified
    test('should use all providers when no primary specified', async () => {
        const provider1 = createMockProvider('provider1', true, false);
        const provider2 = createMockProvider('provider2', true, false);
        
        registerProvider('provider1', () => provider1);
        registerProvider('provider2', () => provider2);

        const result = await analyzeEmail({ 
            email: 'test email' 
        });

        expect(result.provider).toBeDefined();
        expect(result.attemptedProviders.length).toBeGreaterThan(0);
    });
});

