import { isApiConfigured } from '../config';
import { FakeProvider } from './FakeProvider';
import { HttpStreamProvider } from './HttpStreamProvider';
import type { LLMProvider } from './types';

export type ProviderKind = 'fake' | 'http';

export function getProvider(kind: ProviderKind = isApiConfigured() ? 'http' : 'fake'): LLMProvider {
  return kind === 'http' ? new HttpStreamProvider() : new FakeProvider();
}

export { FakeProvider, HttpStreamProvider };
export type { ChatMessage, LLMProvider, LLMRequest } from './types';
