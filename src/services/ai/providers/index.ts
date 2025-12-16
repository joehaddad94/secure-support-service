import { OpenAIProvider } from './OpenAIProvider';
import { registerProvider } from '../ProviderFactory';

registerProvider('openai', () => OpenAIProvider);

