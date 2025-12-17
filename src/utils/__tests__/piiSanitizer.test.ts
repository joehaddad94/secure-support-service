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

    // Edge Cases - Multiple Occurrences
    test('should redact multiple occurrences of the same credit card', () => {
        const text = 'Card 4111-1111-1111-1111 was used. Card 4111-1111-1111-1111 was charged twice.';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).not.toContain('4111-1111-1111-1111');
        expect(result.sanitizedText.split('[REDACTED_CREDIT_CARD]').length).toBe(3);
        expect(result.redactions[0].count).toBe(2);
    });

    test('should redact multiple different credit cards', () => {
        const text = 'Card 4111-1111-1111-1111 and card 5555-5555-5555-4444 were used';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).not.toContain('4111-1111-1111-1111');
        expect(result.sanitizedText).not.toContain('5555-5555-5555-4444');
        expect(result.redactions[0].count).toBe(2);
    });

    test('should redact multiple emails in text', () => {
        const text = 'Contact john@example.com or jane@test.com for help';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).not.toContain('john@example.com');
        expect(result.sanitizedText).not.toContain('jane@test.com');
        expect(result.redactions[0].count).toBe(2);
    });

    test('should redact multiple SSNs', () => {
        const text = 'SSN 123-45-6789 and 987-65-4321 were found';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).not.toContain('123-45-6789');
        expect(result.sanitizedText).not.toContain('987-65-4321');
        expect(result.redactions[0].count).toBe(2);
    });

    // Edge Cases - Null/Undefined/Empty
    test('should handle null input', () => {
        const result = sanitizePII(null as any);
        
        expect(result.sanitizedText).toBe('');
        expect(result.redactions).toHaveLength(0);
    });

    test('should handle undefined input', () => {
        const result = sanitizePII(undefined as any);
        
        expect(result.sanitizedText).toBe('');
        expect(result.redactions).toHaveLength(0);
    });

    test('should handle empty string', () => {
        const result = sanitizePII('');
        
        expect(result.sanitizedText).toBe('');
        expect(result.redactions).toHaveLength(0);
    });

    test('should handle whitespace-only string', () => {
        const result = sanitizePII('   \n\t  ');
        
        expect(result.sanitizedText).toBe('   \n\t  ');
        expect(result.redactions).toHaveLength(0);
    });

    // Edge Cases - Special Characters and Edge Formats
    test('should handle credit card with special regex characters in context', () => {
        const text = 'Card (4111-1111-1111-1111) was used. Price: $100.';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toContain('[REDACTED_CREDIT_CARD]');
        expect(result.sanitizedText).not.toContain('4111-1111-1111-1111');
    });

    test('should handle credit card without separators', () => {
        const text = 'Card number is 4111111111111111';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toContain('[REDACTED_CREDIT_CARD]');
        expect(result.redactions[0].count).toBe(1);
    });

    test('should handle phone numbers in various formats', () => {
        const text = 'Call (555) 123-4567 or +1-555-123-4567 or 5551234567';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).not.toContain('(555) 123-4567');
        expect(result.redactions.find(r => r.type === 'PHONE')?.count).toBeGreaterThan(0);
    });

    // Edge Cases - Overlapping Patterns
    test('should handle text with all PII types', () => {
        const text = 'Contact john@example.com at (555) 123-4567. SSN: 123-45-6789. Card: 4111-1111-1111-1111';
        const result = sanitizePII(text);
        
        expect(result.redactions.length).toBeGreaterThanOrEqual(4);
        expect(result.sanitizedText).not.toContain('john@example.com');
        expect(result.sanitizedText).not.toContain('(555) 123-4567');
        expect(result.sanitizedText).not.toContain('123-45-6789');
        expect(result.sanitizedText).not.toContain('4111-1111-1111-1111');
    });

    test('should handle email that looks like credit card pattern but is not', () => {
        const text = 'Email: test1234567890123@example.com';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toContain('[REDACTED_EMAIL]');
        expect(result.redactions.find(r => r.type === 'CREDIT_CARD')?.count || 0).toBe(0);
    });

    // Edge Cases - Invalid but Pattern-Matching
    test('should not redact credit card pattern that fails Luhn check', () => {
        const text = 'Invalid: 1111-1111-1111-1111';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe(text);
        expect(result.redactions).toHaveLength(0);
    });

    test('should handle credit card with too few digits', () => {
        const text = 'Short: 1234-5678-9012';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe(text);
        expect(result.redactions).toHaveLength(0);
    });

    test('should handle credit card with too many digits', () => {
        const text = 'Long: 1234-5678-9012-3456-7890';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toBe(text);
        expect(result.redactions).toHaveLength(0);
    });

    // Edge Cases - Boundary Conditions
    test('should handle very long text with multiple PII', () => {
        const longText = 'Email: test@example.com. '.repeat(1000) + 'Card: 4111-1111-1111-1111';
        const result = sanitizePII(longText);
        
        expect(result.redactions.length).toBeGreaterThan(0);
        expect(result.sanitizedText).not.toContain('4111-1111-1111-1111');
    });

    test('should handle credit card at start of text', () => {
        const text = '4111-1111-1111-1111 is my card';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toMatch(/^\[REDACTED_CREDIT_CARD\]/);
    });

    test('should handle credit card at end of text', () => {
        const text = 'My card is 4111-1111-1111-1111';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toMatch(/\[REDACTED_CREDIT_CARD\]$/);
    });

    // Edge Cases - Mixed Valid and Invalid
    test('should only redact valid cards when mixed with invalid', () => {
        const text = 'Valid: 4111-1111-1111-1111, Invalid: 1234-5678-9012-3456';
        const result = sanitizePII(text);
        
        expect(result.sanitizedText).toContain('[REDACTED_CREDIT_CARD]');
        expect(result.sanitizedText).toContain('1234-5678-9012-3456');
        expect(result.redactions[0].count).toBe(1);
    });
});
