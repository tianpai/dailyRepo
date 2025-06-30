// ANSI escape codes for colors
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

type Color = keyof typeof colors;

function log(color: Color, message: string) {
  console.log(`${colors[color]}%s${colors.reset}`, message);
}

export function logRed(message: string) {
  log("red", message);
}

export function logGreen(message: string) {
  log("green", message);
}

export function logYellow(message: string) {
  log("yellow", message);
}

export function logBlue(message: string) {
  log("blue", message);
}

export function logMagenta(message: string) {
  log("magenta", message);
}

export function logCyan(message: string) {
  log("cyan", message);
}

export function logWhite(message: string) {
  log("white", message);
}

export function logGray(message: string) {
  log("gray", message);
}