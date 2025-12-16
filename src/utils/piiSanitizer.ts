export interface SanitizationResult {
    sanitizedText: string;
    redactions: Array<{
        type: string;
        placeholder: string;
        count: number;
    }>;
}

const PII_PATTERNS = {
    CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/g,
    
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    PHONE: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
};

const PLACEHOLDERS = {
    CREDIT_CARD: '[REDACTED_CREDIT_CARD]',
    SSN: '[REDACTED_SSN]',
    EMAIL: '[REDACTED_EMAIL]',
    PHONE: '[REDACTED_PHONE]',
};

function sanitizePattern(
    text: string,
    pattern: RegExp,
    placeholder: string,
    type: string
): { sanitized: string; count: number } {
    const matches = text.match(pattern);
    const count = matches ? matches.length : 0;
    
    const sanitized = text.replace(pattern, placeholder);
    
    return { sanitized, count };
}

function isValidCreditCard(cardNumber: string): boolean {

    const digits = cardNumber.replace(/[-\s]/g, '');
    
    if (!/^\d{13,19}$/.test(digits)) {
        return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}
