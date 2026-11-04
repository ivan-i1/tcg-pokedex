import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import type { Language } from './languages';

/** English is the reference: every other file must have the same keys (enforced by a test). */
export type Translation = typeof en;

export const resources: Record<Language, { translation: Translation }> = {
  en: { translation: en },
  es: { translation: es as Translation },
  fr: { translation: fr as Translation },
  it: { translation: it as Translation },
  de: { translation: de as Translation },
  pt: { translation: pt as Translation },
};
