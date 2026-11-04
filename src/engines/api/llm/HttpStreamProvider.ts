import { streamText } from '../client';
import type { LLMProvider, LLMRequest } from './types';

/**
 * Talks to YOUR backend (e.g. a Cloudflare Worker relay like Tessera's), which holds
 * the vendor API key. Never call a model vendor directly from the app: anything in the
 * bundle is public. Expected contract: POST `path` with LLMRequest JSON, response is
 * streamed text/plain or SSE.
 */
export class HttpStreamProvider implements LLMProvider {
  readonly name = 'http';
  constructor(private path = '/v1/chat') {}

  stream(req: LLMRequest, signal?: AbortSignal) {
    return streamText(this.path, { body: req, signal });
  }
}
