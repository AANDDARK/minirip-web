export type miniripBoolean = 1 | 0 | "1" | "0"

export const getTextMiniRipACHIII = (value: number[] | string): string => {
  if (typeof value === "string") {
    return value;
  } else {
    return value.map(code => String.fromCharCode(code)).join('');
  }
};
export function toASCII(input: string) {
  if (/\D/.test(input)) {
    return Array.from(input).map(char => char.charCodeAt(0));
  }
  return input;
}
