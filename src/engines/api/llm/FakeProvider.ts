import type { LLMProvider, LLMRequest } from './types';

const REPLIES: Record<string, string> = {
  en: 'This reply is streamed word by word by the offline demo provider. Swap it for HttpStreamProvider once EXPO_PUBLIC_API_URL points at your backend.',
  es: 'Esta respuesta la transmite palabra por palabra el proveedor de demostración sin conexión. Cámbialo por HttpStreamProvider cuando EXPO_PUBLIC_API_URL apunte a tu servidor.',
  fr: 'Cette réponse est diffusée mot par mot par le fournisseur de démonstration hors ligne. Remplacez-le par HttpStreamProvider dès que EXPO_PUBLIC_API_URL pointe vers votre serveur.',
  it: 'Questa risposta è trasmessa parola per parola dal fornitore demo offline. Sostituiscilo con HttpStreamProvider quando EXPO_PUBLIC_API_URL punta al tuo server.',
  de: 'Diese Antwort wird vom Offline-Demo-Anbieter Wort für Wort gestreamt. Ersetze ihn durch HttpStreamProvider, sobald EXPO_PUBLIC_API_URL auf deinen Server zeigt.',
  pt: 'Esta resposta é transmitida palavra por palavra pelo provedor de demonstração offline. Troque-o pelo HttpStreamProvider quando EXPO_PUBLIC_API_URL apontar para o seu servidor.',
};

/** Offline provider for demos, tests and UI work without a backend. */
export class FakeProvider implements LLMProvider {
  readonly name = 'fake';
  constructor(private delayMs = 45) {}

  async *stream(req: LLMRequest, signal?: AbortSignal) {
    const text = REPLIES[req.locale] ?? REPLIES.en;
    for (const word of text.split(' ')) {
      if (signal?.aborted) return;
      await new Promise((r) => setTimeout(r, this.delayMs));
      yield word + ' ';
    }
  }
}
