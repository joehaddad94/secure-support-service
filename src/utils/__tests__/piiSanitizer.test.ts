import { sanitizePII } from '../piiSanitizer';

describe('PII Sanitizer', () => {
    test('should redact valid credit card number with dashes', () => {
        const text = 'My credit card is 4111-1111-1111-1111';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe('My credit card is [REDACTED_CREDIT_CARD]');
        expect(result.redactions).toHaveLength(1);
        expect(result.redactions[0]).toEqual({
            type: 'CREDIT_CARD',
            placeholder: '[REDACTED_CREDIT_CARD]',
            count: 1,
        });
    });

    test('should redact valid credit card number with spaces', () => {
        const text = 'Please charge 5555 5555 5555 4444 to my account';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toContain('[REDACTED_CREDIT_CARD]');
        expect(result.redactions[0].type).toBe('CREDIT_CARD');
        expect(result.redactions[0].count).toBe(1);
    });

    test('should not redact invalid credit card numbers (fails Luhn check)', () => {
        const text = 'Invalid card: 1234-5678-9012-3456';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe(text);
        expect(result.redactions).toHaveLength(0);
    });

    test('should redact simple email address', () => {
        const text = 'Contact me at john.doe@example.com for more information';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe('Contact me at [REDACTED_EMAIL] for more information');
        expect(result.redactions).toHaveLength(1);
        expect(result.redactions[0]).toEqual({
            type: 'EMAIL',
            placeholder: '[REDACTED_EMAIL]',
            count: 1,
        });
    });

    test('should redact email with subdomain', () => {
        const text = 'Send to support@mail.example.co.uk';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe('Send to [REDACTED_EMAIL]');
        expect(result.redactions[0].type).toBe('EMAIL');
        expect(result.redactions[0].count).toBe(1);
    });
});
