/* Runtime messages only. Page copy is pre-rendered in index.html, en.html and pt.html. */
(() => {
  'use strict';
  const locale = document.documentElement.lang;
  const column = locale === 'en' ? 1 : locale === 'pt-BR' ? 2 : 0;
  const messages = new Map((globalThis.AYSEN_TRANSLATIONS || []).map(row => [row[0], row[column]]));
  function t(source, values = {}) {
    return (messages.get(source) || source).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  }
  window.AysenI18n = {locale, t};

  // Keep the visitor at the same section when switching languages.
  document.querySelectorAll('.language a').forEach(link => link.addEventListener('click', () => {
    const target = new URL(link.href);
    target.hash = location.hash;
    link.href = target.href;
  }));

  // Native validation normally follows the browser UI language, so localize it explicitly.
  const form = document.querySelector('#quote-form');
  form?.querySelectorAll('input, select, textarea').forEach(field => {
    const validate = () => {
      field.setCustomValidity('');
      if (field.validity.valueMissing) field.setCustomValidity(t('Completa este campo.'));
      else if (field.validity.typeMismatch && field.type === 'email') field.setCustomValidity(t('Ingresa un correo electrónico válido.'));
    };
    field.addEventListener('invalid', validate);
    field.addEventListener('input', () => field.setCustomValidity(''));
    field.addEventListener('change', () => field.setCustomValidity(''));
  });
})();
