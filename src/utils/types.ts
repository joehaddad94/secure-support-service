export interface SanitizationResult {
    sanitizedText: string;
    redactions: Array<{
        type: string;
        placeholder: string;
        count: number;
    }>;
}