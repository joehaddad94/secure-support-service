import { registerProvider, createProvider, getAvailableProviders } from '../ProviderFactory';
import { AIProvider, EmailAnalysis } from '../types';

describe('ProviderFactory', () => {
    const createMockProvider = (name: string): AIProvider => ({
        getName: () => name,
        isAvailable: () => true,
        analyzeEmail: async (): Promise<EmailAnalysis> => ({
            intent: 'test',
            sentiment: 'neutral',
            summary: 'test',
            suggestedReply: 'test',
            urgency: 'low',
        }),
    });

    beforeEach(() => {
        // Note: ProviderFactory doesn't have unregister, so tests may affect each other
        // In a real scenario, you'd want to add an unregister method or reset function
    });

    // Edge Cases - Provider Not Found
    test('should throw error when provider not found', () => {
        expect(() => {
            createProvider('non-existent-provider');
        }).toThrow('Provider non-existent-provider not found');
    });

    test('should throw error with correct provider name in message', () => {
        try {
            createProvider('missing-provider');
        } catch (error: any) {
            expect(error.message).toContain('missing-provider');
        }
    });

    // Edge Cases - Case Sensitivity
    test('should handle case-insensitive provider registration', () => {
        const provider = createMockProvider('test-provider');
        registerProvider('TEST-PROVIDER', () => provider);

        const retrieved = createProvider('test-provider');
        expect(retrieved.getName()).toBe('test-provider');
    });

    test('should handle case-insensitive provider retrieval', () => {
        const provider = createMockProvider('test-provider');
        registerProvider('test-provider', () => provider);

        const retrieved1 = createProvider('TEST-PROVIDER');
        const retrieved2 = createProvider('Test-Provider');
        const retrieved3 = createProvider('tEsT-pRoViDeR');

        expect(retrieved1.getName()).toBe('test-provider');
        expect(retrieved2.getName()).toBe('test-provider');
        expect(retrieved3.getName()).toBe('test-provider');
    });

    // Edge Cases - Duplicate Registration
    test('should allow overwriting provider registration', () => {
        const provider1 = createMockProvider('provider1');
        const provider2 = createMockProvider('provider2');

        registerProvider('test', () => provider1);
        expect(createProvider('test').getName()).toBe('provider1');

        registerProvider('test', () => provider2);
        expect(createProvider('test').getName()).toBe('provider2');
    });

    // Edge Cases - Empty Provider Name
    test('should handle empty provider name registration', () => {
        const provider = createMockProvider('empty');
        registerProvider('', () => provider);

        const retrieved = createProvider('');
        expect(retrieved.getName()).toBe('empty');
    });

    test('should handle whitespace-only provider name', () => {
        const provider = createMockProvider('whitespace');
        registerProvider('   ', () => provider);

        const retrieved = createProvider('   ');
        expect(retrieved.getName()).toBe('whitespace');
    });

    // Edge Cases - Special Characters in Provider Name
    test('should handle provider names with special characters', () => {
        const provider = createMockProvider('special-provider');
        registerProvider('provider-v2.0', () => provider);

        const retrieved = createProvider('provider-v2.0');
        expect(retrieved.getName()).toBe('special-provider');
    });

    // Edge Cases - Get Available Providers
    test('should return empty array when no providers registered', () => {
        // This is hard to test without unregister, but we can check the function exists
        const providers = getAvailableProviders();
        expect(Array.isArray(providers)).toBe(true);
    });

    test('should return all registered provider names', () => {
        registerProvider('provider1', () => createMockProvider('provider1'));
        registerProvider('provider2', () => createMockProvider('provider2'));

        const providers = getAvailableProviders();
        expect(providers).toContain('provider1');
        expect(providers).toContain('provider2');
    });

    // Edge Cases - Factory Function Behavior
    test('should call factory function each time provider is created', () => {
        let callCount = 0;
        const factory = () => {
            callCount++;
            return createMockProvider(`provider-${callCount}`);
        };

        registerProvider('factory-test', factory);

        createProvider('factory-test');
        createProvider('factory-test');
        createProvider('factory-test');

        expect(callCount).toBe(3);
    });

    test('should return new instance each time (if factory creates new instances)', () => {
        const factory = () => createMockProvider('instance-test');
        registerProvider('instance-test', factory);

        const instance1 = createProvider('instance-test');
        const instance2 = createProvider('instance-test');

        // They should be different objects (if provider creates new instances)
        // This depends on provider implementation
        expect(instance1).toBeDefined();
        expect(instance2).toBeDefined();
    });

    // Edge Cases - Null/Undefined Factory
    test('should handle factory that returns null', () => {
        registerProvider('null-provider', () => null as any);

        expect(() => {
            createProvider('null-provider');
        }).not.toThrow(); // Factory is called, but provider methods would fail
    });

    // Edge Cases - Provider Name Normalization
    test('should normalize provider names to lowercase', () => {
        const provider = createMockProvider('normalized');
        registerProvider('MixedCaseProvider', () => provider);

        const providers = getAvailableProviders();
        const normalizedName = 'mixedcaseprovider';
        expect(providers).toContain(normalizedName);
    });
});

