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



