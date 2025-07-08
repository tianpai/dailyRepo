/**
 * Determines the optimal foreground color (black or white) for a given background color
 * to maximize contrast, following WCAG principles.
 * @param backgroundColorHex The background color in hexadecimal format (e.g., "#RRGGBB").
 * @returns "#000000" for black or "#FFFFFF" for white.
 */
export function getOptimalForegroundColor(
  backgroundColorHex: string,
): "#000000" | "#FFFFFF" {
  const L_bg = getRelativeLuminance(backgroundColorHex);
  const L_white = 1.0; // Relative luminance of white
  const L_black = 0.0; // Relative luminance of black

  // Calculate contrast ratio with white foreground
  const contrastWithWhite = getContrastRatio(L_bg, L_white);

  // Calculate contrast ratio with black foreground
  const contrastWithBlack = getContrastRatio(L_bg, L_black);

  // Return the foreground color that provides higher contrast
  if (contrastWithWhite > contrastWithBlack) {
    return "#FFFFFF";
  } else {
    return "#000000";
  }
}

/**
 * Converts an 8-bit sRGB color component (0-255) to its linear RGB equivalent.
 * This is a helper function for calculating relative luminance.
 * @param c8bit The 8-bit color component (R, G, or B).
 * @returns The linear RGB component (0-1).
 */
function sRGBtoLinearRGB(c8bit: number): number {
  const c_sRGB = c8bit / 255;
  if (c_sRGB <= 0.03928) {
    return c_sRGB / 12.92;
  } else {
    return Math.pow((c_sRGB + 0.055) / 1.055, 2.4);
  }
}

/**
 * Calculates the relative luminance of a color in the sRGB color space.
 * Relative luminance is a measure of the perceived brightness of a color,
 * ranging from 0 (black) to 1 (white).
 * @param hexColor The color in hexadecimal format (e.g., "#RRGGBB").
 * @returns The relative luminance value.
 */
function getRelativeLuminance(hexColor: string): number {
  // Remove '#' if present
  const cleanHex = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;

  // Parse R, G, B components
  const r8bit = parseInt(cleanHex.substring(0, 2), 16);
  const g8bit = parseInt(cleanHex.substring(2, 4), 16);
  const b8bit = parseInt(cleanHex.substring(4, 6), 16);

  // Convert sRGB to linear RGB
  const R = sRGBtoLinearRGB(r8bit);
  const G = sRGBtoLinearRGB(g8bit);
  const B = sRGBtoLinearRGB(b8bit);

  // Calculate relative luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the contrast ratio between two colors based on their relative luminances.
 * The ratio ranges from 1:1 (no contrast) to 21:1 (maximum contrast, e.g., black on white).
 * @param L1 Relative luminance of the lighter color.
 * @param L2 Relative luminance of the darker color.
 * @returns The contrast ratio.
 */
function getContrastRatio(L1: number, L2: number): number {
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
