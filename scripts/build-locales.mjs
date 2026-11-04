/* Rebuild translated static pages after changing index.html or translations.js.
   No dependency installation is needed: node scripts/build-locales.mjs */
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import '../assets/translations.js';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('index.html', root), 'utf8');
const rows = globalThis.AYSEN_TRANSLATIONS;
if (new Set(rows.map(row => row[0])).size !== rows.length) throw new Error('Duplicate translation key');
const unchanged = new Set(['ES', 'EN', 'PT', 'Carretera Austral', 'Aysén Patagonia Tour', 'DMC Carretera Austral', 'Destination Management Company', 'Chile', '01', '02', '03', '04', '−', '+']);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");

for (const [locale, column, file] of [['en', 1, 'en.html'], ['pt-BR', 2, 'pt.html']]) {
  const messages = new Map(rows.map(row => [row[0], row[column]]));
  const missing = new Set();
  function translate(raw) {
    const text = decode(raw.trim());
    if (!text || unchanged.has(text)) return raw;
    if (!messages.has(text)) { missing.add(text); return raw; }
    return raw.replace(raw.trim(), () => escape(messages.get(text)));
  }
  // Translate text nodes and editorial attributes only. CSS, scripts, IDs,
  // asset URLs, company names, and all link targets are kept intact.
  let html = source.replace(/<span\b[^>]*data-i18n="[^"]+"[^>]*>[\s\S]*?<\/span>|<(script|style)\b[^>]*>[\s\S]*?<\/\1>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/gi, token => {
    // Translate complete phrases even when the Spanish layout contains a line break.
    // This keeps the wording independent of the source's individual text nodes.
    if (token.startsWith('<span') && token.includes('data-i18n=')) {
      const key = token.match(/data-i18n="([^"]+)"/)[1];
      if (!messages.has(key)) { missing.add(key); return token; }
      return token.replace(/>[\s\S]*<\/span>$/, `>${escape(messages.get(key))}</span>`);
    }
    if (/^<(script|style)\b|^<!--/i.test(token)) return token;
    if (token.startsWith('<')) return token.replace(/\b(aria-label|alt|title|content)="([^"]*)"/g, (match, attr, value) => {
      // Only the description meta content is editorial; viewport/charset are not.
      if (attr === 'content' && !token.includes('name="description"')) return match;
      if (['Español', 'English', 'Português (Brasil)'].includes(value)) return match;
      return `${attr}="${translate(value)}"`;
    });
    return translate(token);
  });
  if (missing.size) throw new Error(`Missing ${locale} translations: ${[...missing].join(' | ')}`);
  html = html.replace('<html lang="es">', `<html lang="${locale}">`)
    .replace(' aria-current="page"', '')
    .replace(`hreflang="${locale}" aria-label=`, `hreflang="${locale}" aria-current="page" aria-label=`);
  await writeFile(new URL(file, root), html);
  console.log(`${fileURLToPath(new URL(file, root))} · ${locale}`);
}
