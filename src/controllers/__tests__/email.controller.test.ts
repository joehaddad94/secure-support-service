import { Request, Response, NextFunction } from 'express';
import { analyzeEmailController } from '../email.controller';
import { analyzeEmail } from '../../services/ai/AIService';
import { sanitizePII } from '../../utils/piiSanitizer';
import { config } from '../../config/env';

// Mock dependencies
jest.mock('../../services/ai/AIService');
jest.mock('../../utils/piiSanitizer');
jest.mock('../../config/env', () => ({
    config: {
        aiProvider: 'default-provider',
    },
}));

const mockAnalyzeEmail = analyzeEmail as jest.MockedFunction<typeof analyzeEmail>;
const mockSanitizePII = sanitizePII as jest.MockedFunction<typeof sanitizePII>;

describe('Email Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let jsonResponse: any;
    let statusResponse: any;

    beforeEach(() => {
        jsonResponse = jest.fn();
        statusResponse = jest.fn().mockReturnValue({ json: jsonResponse });

        mockRequest = {
            body: {},
            headers: {},
        };

        mockResponse = {
            json: jsonResponse,
            status: statusResponse,
        };

        mockNext = jest.fn();

        jest.clearAllMocks();

        // Default successful mocks
        mockSanitizePII.mockReturnValue({
            sanitizedText: 'sanitized email',
            redactions: [],
        });

        mockAnalyzeEmail.mockResolvedValue({
            analysis: {
                intent: 'test',
                sentiment: 'neutral',
                summary: 'test',
                suggestedReply: 'test',
                urgency: 'low',
            },
            provider: 'test-provider',
            attemptedProviders: ['test-provider'],
        });
    });

    // Edge Cases - Invalid Input
    test('should return 400 when email is missing', async () => {
        mockRequest.body = {};

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Validation failed');
    });

    test('should return 400 when email is empty string', async () => {
        mockRequest.body = { email: '' };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('should return 400 when email is not a string', async () => {
        mockRequest.body = { email: 12345 };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('should return 400 when email is null', async () => {
        mockRequest.body = { email: null };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    // Edge Cases - Missing Body
    test('should handle missing request body', async () => {
        mockRequest.body = undefined;

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    // Edge Cases - Provider Header
    test('should use header provider when provided', async () => {
        mockRequest.body = { email: 'test email' };
        mockRequest.headers = { 'x-ai-provider': 'header-provider' };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockAnalyzeEmail).toHaveBeenCalledWith({
            primaryProvider: 'header-provider',
            email: 'sanitized email',
        });
    });

    test('should use config default when header not provided', async () => {
        mockRequest.body = { email: 'test email' };
        mockRequest.headers = {};

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockAnalyzeEmail).toHaveBeenCalledWith({
            primaryProvider: 'default-provider',
            email: 'sanitized email',
        });
    });

    test('should handle case-insensitive provider header', async () => {
        mockRequest.body = { email: 'test email' };
        // Express normalizes headers to lowercase, so 'x-ai-provider' is the actual key
        mockRequest.headers = { 'x-ai-provider': 'header-provider' };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockAnalyzeEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                primaryProvider: 'header-provider',
            })
        );
    });

    // Edge Cases - Service Errors
    test('should return 502 when all providers fail', async () => {
        mockRequest.body = { email: 'test email' };
        mockAnalyzeEmail.mockRejectedValue(
            new Error('All providers failed. Attempted: provider1, provider2.')
        );

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(502);
        expect(error.message).toContain('All providers failed');
    });

    test('should return 500 for unexpected errors', async () => {
        mockRequest.body = { email: 'test email' };
        mockAnalyzeEmail.mockRejectedValue(new Error('Unexpected error'));

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error.statusCode).toBe(500);
    });

    test('should handle non-Error thrown objects', async () => {
        mockRequest.body = { email: 'test email' };
        mockAnalyzeEmail.mockRejectedValue('string error');

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = (mockNext as jest.Mock).mock.calls[0][0];
        expect(error).toBeInstanceOf(Error);
    });

    // Edge Cases - PII Sanitization
    test('should include redactions in response', async () => {
        mockRequest.body = { email: 'test email' };
        mockSanitizePII.mockReturnValue({
            sanitizedText: 'sanitized',
            redactions: [
                { type: 'CREDIT_CARD', placeholder: '[REDACTED_CREDIT_CARD]', count: 1 },
            ],
        });

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(jsonResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                redactions: expect.arrayContaining([
                    expect.objectContaining({ type: 'CREDIT_CARD' }),
                ]),
            })
        );
    });

    test('should handle empty redactions array', async () => {
        mockRequest.body = { email: 'test email' };
        mockSanitizePII.mockReturnValue({
            sanitizedText: 'sanitized',
            redactions: [],
        });

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(jsonResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                redactions: [],
            })
        );
    });

    // Edge Cases - Response Structure
    test('should return correct response structure', async () => {
        mockRequest.body = { email: 'test email' };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(jsonResponse).toHaveBeenCalledWith({
            analysis: expect.objectContaining({
                intent: expect.any(String),
                sentiment: expect.any(String),
                summary: expect.any(String),
                suggestedReply: expect.any(String),
                urgency: expect.any(String),
            }),
            provider: expect.any(String),
            redactions: expect.any(Array),
            attemptedProviders: expect.any(Array),
        });
    });

    // Edge Cases - Very Long Email
    test('should handle very long email content', async () => {
        const longEmail = 'a'.repeat(100000);
        mockRequest.body = { email: longEmail };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockSanitizePII).toHaveBeenCalledWith(longEmail);
    });

    // Edge Cases - Special Characters in Email
    test('should handle email with special characters', async () => {
        const specialEmail = 'Email with special chars: <script>alert("xss")</script> & "quotes"';
        mockRequest.body = { email: specialEmail };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockSanitizePII).toHaveBeenCalledWith(specialEmail);
    });

    // Edge Cases - Unicode and Emoji
    test('should handle email with unicode characters', async () => {
        const unicodeEmail = 'Email with unicode: 你好 🌟 🎉';
        mockRequest.body = { email: unicodeEmail };

        await analyzeEmailController(
            mockRequest as Request,
            mockResponse as Response,
            mockNext
        );

        expect(mockSanitizePII).toHaveBeenCalledWith(unicodeEmail);
    });
});

