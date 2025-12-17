import OpenAI from 'openai';
import { AIProvider, EmailAnalysis } from '../types';
import { emailAnalysisSchema } from '../../../validators/responseSchema';
import { config } from '../../../config/env';

let client: OpenAI | null = null;

function getName(): string {
    return 'openai';
}

function isAvailable(): boolean {
    return !!config.openaiApiKey;
}

// JSON Schema for structured output (converted from Zod schema)
const emailAnalysisJsonSchema = {
    type: 'object',
    properties: {
        intent: {
            type: 'string',
            description: 'Brief description of what the customer wants',
        },
        sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
            description: 'The emotional tone of the email',
        },
        summary: {
            type: 'string',
            description: 'Short summary of the email content',
        },
        suggestedReply: {
            type: 'string',
            description: 'Draft reply to the customer',
        },
        urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'The urgency level of the customer request',
        },
    },
    required: ['intent', 'sentiment', 'summary', 'suggestedReply', 'urgency'],
    additionalProperties: false,
} as const;

async function analyzeEmail(email: string): Promise<EmailAnalysis> {
    if (!isAvailable()) {
        throw new Error('OpenAI API key not configured');
    }

    if (!client) {
        client = new OpenAI({ apiKey: config.openaiApiKey });
    }

    const prompt = `Analyze this customer service email and provide a structured analysis.

Email content:
${email}`;

    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'email_analysis',
                strict: true,
                schema: emailAnalysisJsonSchema,
            },
        },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }

    let analysis: EmailAnalysis;
    try {
        analysis = JSON.parse(content) as EmailAnalysis;
    } catch {
        throw new Error('Failed to parse OpenAI response');
    }

    // Validate with Zod schema as additional safety check
    const valid = emailAnalysisSchema.safeParse(analysis);
    if (!valid.success) {
        throw new Error('AI response validation failed');
    }

    return valid.data;
}

export const OpenAIProvider: AIProvider = {
    getName,
    isAvailable,
    analyzeEmail,
};

