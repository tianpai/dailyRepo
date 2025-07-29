import type { LanguageMap } from "@/interface/repository.tsx";
import { type colorMap, languageColors } from "@/data/language-color";

export type PieDatum = {
  language: string; // label
  count: number; // number in percentage (0–100)
  fill: string; // slice color
};

export function maxLanguageCount(languageRaw: LanguageMap): string {
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

/**
 * Transforms a LanguageMap (`{ [lang]: count }`) into an array of
 * objects ready for most chart libraries (e.g. Recharts, Chart.js).
 *
 * Each output item has:
 *   • language – the language name (string)
 *   • count    – the numeric value from the source map
 *   • fill     – a hex color; taken from `langColor` or defaults to black
 *
 * @param language  Mapping of language names to a numeric metric
 *                  (e.g., bytes of code, lines of code, repo size).
 * @param langColor Optional mapping of language names to hex colors.
 *                  Defaults to the predefined `languageColors` object.
 *
 * @returns Array<{ language: string; count: number; fill: string }>
 *
 * @example
 * const language = { JavaScript: 275, Go: 173, Python: 90, HTML: 100 };
 * const langColor = {
 *   JavaScript: '#814CCC',
 *   Go:         '#38761D',
 *   Python:     '#004289',
 *   HTML:       '#E8274B',
 * };
 *
 * convertToChartData(language, langColor);
 * // [
 * //   { language: 'JavaScript', count: 275, fill: '#814CCC' },
 * //   { language: 'Go',         count: 173, fill: '#38761D' },
 * //   { language: 'Python',     count: 90,  fill: '#004289' },
 * //   { language: 'HTML',       count: 100, fill: '#E8274B' }
 * // ]
 *
 * @example
 * // Color missing → falls back to black
 * convertToChartData({ Rust: 42 });
 * // [ { language: 'Rust', count: 42, fill: '#000000' } ]
 */
export function toChartData(
  language: LanguageMap,
  langColor: colorMap = languageColors,
): PieDatum[] {
  const total = Object.values(language).reduce((sum, n) => sum + n, 0);
  if (total === 0) return []; // nothing to chart

  // round each percentage
  const raw: PieDatum[] = Object.entries(language).map(([lang, cnt]) => {
    const pct = Math.round((cnt / total) * 100); // no decimals
    return {
      language: lang,
      count: pct,
      fill: langColor[lang] ?? "#000000",
    };
  });

  // make sure they sum to exactly 100
  const sum = raw.reduce((s, d) => s + d.count, 0);
  const diff = 100 - sum; // can be -1, 0, or +1 in most cases
  if (diff !== 0 && raw.length) {
    // bump the slice with the largest percentage (could also pick the largest remainder)
    const idx = raw.reduce(
      (best, d, i) => (d.count > raw[best].count ? i : best),
      0,
    );
    raw[idx].count += diff; // adjust by ±1 (or whatever diff is)
  }
  const check = Object.values(raw).reduce((sum, lang) => sum + lang.count, 0);
  console.assert(check === 100, "Total percentage must equal 100");
  return raw;
}
