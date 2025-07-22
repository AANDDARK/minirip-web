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
let VariableStorage = new Map()  
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
  // variable sigils
  switch (firstChar) {
    case '$': {
      if (res.length < 2) return undefined;
      const varName = res[1];
      const varValue = res[2];
      return `() => { VariableStorage.set("${varName}", ${varValue}) }`;
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
        return `() => {  VariableStorage.set("${varName}" , [${asciiCodes.join(', ')}])}`;
      } else {
        return `() => {  VariableStorage.set("${varName}", [${res.slice(2).join}])}`;
      }
    }
    // output
    case '#': {
      if (res.length < 2) return undefined;
      if(/\d/.test(res[1])){
        return `() => { console.log(${res[1]})}`;
      }
      return `() => { console.log(VariableStorage.get("${res[1]}")); }`;
    }

    case '!': {
      if (res.length < 2) return undefined;
      const expr = res.slice(1).join(' ');
      return `() => { console.log(getTextMiniRipACHIII(VariableStorage.get("${expr}"))); }`;
    }
    // math
    case '+':
    case '-':
    case '*':
    case '/':
    case '%': {
      if (res.length < 3) return undefined;
        const op = firstChar;
       if(/\D/.test(res[2])){
        return `() => { VariableStorage.set("${res[1]}", VariableStorage.get("${res[1]}") ${op}  VariableStorage.get("${res[2]}")); }`
       }
      return `() => { VariableStorage.set("${res[1]}", VariableStorage.get("${res[1]}") ${op} ${res[2]}); }`;
    }
    // goto and labels
    case '&': {
      if (res.length < 2) return undefined;
      return `() => { /* label ${res[1]} */ }`;
    }

    case '^': {
      if (res.length < 2) return undefined;
      return `() => { jump('${res[1]}'); }`;
    }


    //  conditional sigils
    case '=':
    case '<':
    case '>' : {
      if (res.length < 4) return undefined;
      const op = firstChar;
      if(op == "="){
        return `() => { (${res[2]} === ${res[3]}) ? VariableStorage.set("${res[1]}", 1) : VariableStorage.set("${res[1]}", 0) }`;
      }
      return `() => { (${res[2]} ${op} ${res[3]}) ? VariableStorage.set("${res[1]}", 1) : VariableStorage.set("${res[1]}", 0) }`;
    }

case ':': {
  if (res.length < 3) return undefined;

  const target = res[1];
  const args = res.slice(2);

  const evaluated = args.map(arg => {
    if (/\D/.test(arg)) {
      return `VariableStorage.get("${arg}")`;
    } else {
      return `${Number(arg)}`;
    }
  });

  return `() => {
    const values = [${evaluated.join(', ')}];
    const hasOne = values.some(v => Number(v) === 1);
    VariableStorage.set("${target}", hasOne ? 1 : 0);
  }`;
}

  
case ';': {
  if (res.length < 3) return undefined;

  const target = res[1];
  const args = res.slice(2);

  const evaluated = args.map(arg => {
    if (/\D/.test(arg)) {
      const varName = arg.slice(1);
      return `VariableStorage.get("${varName}")`;
    } else {
      return `${Number(arg)}`;
    }
  });

  return `() => {
    const values = [${evaluated.join(', ')}];
    const allOnes = values.every(v => Number(v) === 1);
    VariableStorage.set("${target}", allOnes ? 1 : 0);
  }`;
}



    default:
      return undefined;
  }
};

const getLines = (source: string): string[] => source.trim().split('\n');
