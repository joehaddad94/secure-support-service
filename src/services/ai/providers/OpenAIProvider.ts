import OpenAI from 'openai';
import { AIProvider, EmailAnalysis } from '../types';
import { config } from '../../../config/env';

let client: OpenAI | null = null;

function getName(): string {
    return 'openai';
}

function isAvailable(): boolean {
    return !!config.openaiApiKey;
}

async function analyzeEmail(email: string): Promise<EmailAnalysis> {
    if (!isAvailable()) {
        throw new Error('OpenAI API key not configured');
    }

    if (!client) {
        client = new OpenAI({ apiKey: config.openaiApiKey });
    }

    const prompt = `Analyze this customer service email and return a JSON object with the following structure:
                        {
                        "intent": "brief description of what the customer wants",
                        "sentiment": "positive" or "neutral" or "negative",
                        "summary": "short summary of the email",
                        "suggestedReply": "draft reply to the customer",
                        "urgency": "low" or "medium" or "high"
                        }

                        Email content:
                        ${email}

                        Return only valid JSON, no other text.`;

    const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }

    try {
        const analysis = JSON.parse(content) as EmailAnalysis;
        return analysis;
    } catch (error) {
        throw new Error('Failed to parse OpenAI response');
    }
}

export const OpenAIProvider: AIProvider = {
    getName,
    isAvailable,
    analyzeEmail,
};

