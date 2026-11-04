// i18next picks plural forms (`key_one`, `key_other`, `key_many`) with Intl.PluralRules,
// which Hermes does not fully implement. Without this, every count renders the
// `_other` form ("1 bounces"). The `/polyfill` entry points only install when needed.
import '@formatjs/intl-getcanonicallocales/polyfill.js';
import '@formatjs/intl-locale/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/de.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/es.js';
import '@formatjs/intl-pluralrules/locale-data/fr.js';
import '@formatjs/intl-pluralrules/locale-data/it.js';
import '@formatjs/intl-pluralrules/locale-data/pt.js';
