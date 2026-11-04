export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type LLMRequest = {
  messages: ChatMessage[];
  /** UI language, so the model answers in it. */
  locale: string;
};

/**
 * One interface for every model backend: your own relay, a vendor proxy, an
 * on-device model, or the offline fake. Screens depend on this, never on a vendor.
 */
export interface LLMProvider {
  readonly name: string;
  stream(req: LLMRequest, signal?: AbortSignal): AsyncIterable<string>;
}
