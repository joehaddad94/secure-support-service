import { SanitizationResult } from './types';
import { PII_PATTERNS, PLACEHOLDERS } from './constants';

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

function sanitizeCreditCards(text: string): { sanitized: string; count: number } {
    const matches = text.match(PII_PATTERNS.CREDIT_CARD);
    let count = 0;
    let sanitized = text;
    
    if (matches) {
        matches.forEach(match => {
            if (isValidCreditCard(match)) {
                sanitized = sanitized.replace(match, PLACEHOLDERS.CREDIT_CARD);
                count++;
            }
        });
    }
    
    return { sanitized, count };
}

export function sanitizePII(text: string): SanitizationResult {
    if (!text || typeof text !== 'string') {
        return {
            sanitizedText: text || '',
            redactions: [],
        };
    }
    
    let sanitized = text;
    const redactions: Array<{ type: string; placeholder: string; count: number }> = [];
    
    const creditCardResult = sanitizeCreditCards(sanitized);
    sanitized = creditCardResult.sanitized;
    if (creditCardResult.count > 0) {
        redactions.push({
            type: 'CREDIT_CARD',
            placeholder: PLACEHOLDERS.CREDIT_CARD,
            count: creditCardResult.count,
        });
    }
    
    const ssnResult = sanitizePattern(
        sanitized,
        PII_PATTERNS.SSN,
        PLACEHOLDERS.SSN,
        'SSN'
    );
    sanitized = ssnResult.sanitized;
    if (ssnResult.count > 0) {
        redactions.push({
            type: 'SSN',
            placeholder: PLACEHOLDERS.SSN,
            count: ssnResult.count,
        });
    }
    
    const emailResult = sanitizePattern(
        sanitized,
        PII_PATTERNS.EMAIL,
        PLACEHOLDERS.EMAIL,
        'EMAIL'
    );
    sanitized = emailResult.sanitized;
    if (emailResult.count > 0) {
        redactions.push({
            type: 'EMAIL',
            placeholder: PLACEHOLDERS.EMAIL,
            count: emailResult.count,
        });
    }
    
    const phoneResult = sanitizePattern(
        sanitized,
        PII_PATTERNS.PHONE,
        PLACEHOLDERS.PHONE,
        'PHONE'
    );
    sanitized = phoneResult.sanitized;
    if (phoneResult.count > 0) {
        redactions.push({
            type: 'PHONE',
            placeholder: PLACEHOLDERS.PHONE,
            count: phoneResult.count,
        });
    }
    
    return {
        sanitizedText: sanitized,
        redactions,
    };
}
