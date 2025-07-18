export const Transpile = (
  source: string | null | unknown,
  isRunning?: boolean
): string | undefined => {
  if (source == null) {
    return 'not have minirip';
  }
  if (typeof source !== 'string') {
    return '';
  }

  const code = parse(source);

  if (isRunning) {
    console.log(code);
    return eval(code);
  } else {
    return code;
  }
};

// Глобальні змінні
let labels: Record<string, number> = {};
let currentLine = 0;

const parse = (source: string): string => {
  labels = {}; 
  const lines = getLines(source);

  
  lines.forEach((line, index) => {
    const res = line.trim().split(/\s+/);
    if (res[0] === '&' && res.length >= 2) {
      labels[res[1]] = index;
    }
  });

  currentLine = 0;
  const outputLines = lines
    .map((line) => {
      const result = lexing(line);
      currentLine++;
      return result;
    })
    .filter((line): line is string => line !== undefined);

  return `
const labels = ${JSON.stringify(labels)};
const instructions = [
  ${outputLines.join(',\n  ')}
];

let pointer = 0;

function jump(label) {
  if (label in labels) {
    pointer = labels[label];
  } else {
    throw new Error("Label not found: " + label);
  }
}

while (pointer < instructions.length) {
  instructions[pointer]();
  pointer++;
}
`;
};

const lexing = (line: string): string | undefined => {
  const res = line.trim().split(/\s+/);
  const firstChar = line.charAt(0);

  switch (firstChar) {
    case '$': {
      if (res.length < 2) return undefined;
      const varName = res[1];
      const varValue = res[2];
      return `() => { let ${varName} = ${varValue}; }`;
    }

    case '@': {
      if (res.length < 2) return undefined;
      const varName = res[1];
      const joined = res.slice(2).join(' ');
      if (joined.startsWith('"') || joined.startsWith("'")) {
        const rawStr = joined.slice(1, -1);
        let decodedStr = '';
        try {
          decodedStr = JSON.parse(`"${rawStr}"`);
        } catch {
          decodedStr = rawStr;
        }
        const asciiCodes = [...decodedStr].map(c => c.charCodeAt(0));
        return `() => { let ${varName} = [${asciiCodes.join(', ')}]; }`;
      } else {
        return `() => { let ${varName} = [${res.slice(2).join(', ')}]; }`;
      }
    }

    case '#': {
      if (res.length < 2) return undefined;
      return `() => { console.log(${res[1]}); }`;
    }

    case '!': {
      if (res.length < 2) return undefined;
      const expr = res.slice(1).join(' ');
      return `() => { console.log(getTextMiniRipACHIII(${expr})); }`;
    }

    case '+':
    case '-':
    case '*':
    case '/': {
      if (res.length < 3) return undefined;
      const op = firstChar;
      return `() => { ${res[1]} = ${res[1]} ${op} ${res[2]}; }`;
    }

    case '&': {
      if (res.length < 2) return undefined;
      // Мітка — нічого не робимо, просто коментар
      return `() => { /* label ${res[1]} */ }`;
    }

    case '^': {
      if (res.length < 2) return undefined;
      return `() => { jump('${res[1]}'); }`;
    }

    default:
      return undefined;
  }
};

const getLines = (source: string): string[] => source.trim().split('\n');
