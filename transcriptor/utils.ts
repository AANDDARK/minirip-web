export const getTextMiniRipACHIII = (value: number[] | string): string => {
  if (typeof value === "string") {
    return value;
  } else {
    return value.map(code => String.fromCharCode(code)).join('');
  }
};
