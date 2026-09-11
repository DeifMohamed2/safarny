const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales');

const dictionaries = {
  en: JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8')),
  ar: JSON.parse(fs.readFileSync(path.join(localesDir, 'ar.json'), 'utf8')),
};

function getNested(obj, key) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part];
    return undefined;
  }, obj);
}

function createTranslator(lang) {
  const dict = dictionaries[lang] || dictionaries.en;
  return function t(key, fallback) {
    const value = getNested(dict, key);
    if (typeof value === 'string') return value;
    if (fallback) return fallback;
    const english = getNested(dictionaries.en, key);
    if (typeof english === 'string') return english;
    return key;
  };
}

module.exports = {
  dictionaries,
  createTranslator,
  supportedLangs: ['en', 'ar'],
};
