import { LanguageMap } from "../types/database";

/**
 * Finds the primary language (most used) from a language map.
 * Port of frontend logic from pie-chart-data.ts
 * 
 * @param languageRaw - Object mapping language names to byte counts
 * @returns The language with the highest byte count, or empty string if no languages
 * 
 * @example
 * const languages = { "JavaScript": 275000, "TypeScript": 150000, "CSS": 50000 };
 * getPrimaryLanguage(languages); // "JavaScript"
 */
export function getPrimaryLanguage(languageRaw: LanguageMap): string {
  let maxLang = "";
  let maxCount = -Infinity; // works even if counts can be 0

  for (const [lang, count] of Object.entries(languageRaw)) {
    if (count > maxCount) {
      maxCount = count;
      maxLang = lang;
    }
  }

  return maxLang; // "" if the map was empty
}