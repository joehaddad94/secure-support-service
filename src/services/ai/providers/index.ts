import { OpenAIProvider } from './OpenAIProvider';
import { MockAnthropicProvider } from './MockAnthropicProvider';
import { MockGeminiProvider } from './MockGeminiProvider';
import { registerProvider } from '../ProviderFactory';

registerProvider('openai', () => OpenAIProvider);
registerProvider('mock-anthropic', () => MockAnthropicProvider);
registerProvider('mock-gemini', () => MockGeminiProvider);

