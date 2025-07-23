type miniripBoolean = 1 | 0 | "1" | "0"

export const getTextMiniRipACHIII = (value: number[] | string): string => {
  if (typeof value === "string") {
    return value;
  } else {
    return value.map(code => String.fromCharCode(code)).join('');
  }
};
export function getExecuteMiniRip(stackOfFunc: Array<Function>, bol: miniripBoolean, lineQuery: number){
  
} 