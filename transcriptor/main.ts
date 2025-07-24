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


const parse = (source: string): string => {
  labels = {};
  const lines = getLines(source);

  lines.forEach((line, index) => {
    const res = line.trim().split(/\s+/);
    if (res[0] === '&' && res.length >= 2) {
      labels[res[1]] = index;
    }
  });

  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const { line, skip } = lexing(lines, i) ?? { line: undefined, skip: 0 };
    if (line) outputLines.push(line);
    i += skip;
  }

  return `
let VariableStorage = new Map();
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


const lexing = (lines: string[], index: number): { line: string | undefined, skip: number } => {
  const line = lines[index];
  const res = line.trim().split(/\s+/);
  const firstChar = line.charAt(0);

  switch (firstChar) {
    case '$': {
      if (res.length < 3) return { line: undefined, skip: 0 };
      const varName = res[1];
      const varValue = res[2];
      if(/\D/.test(varValue)){
        return { line: `() => { VariableStorage.set("${varName}", VariableStorage.get("${varValue}")) }`, skip: 0 };
      }
      return { line: `() => { VariableStorage.set("${varName}", ${varValue}) }`, skip: 0 };
    }

    case '@': {
      if (res.length < 3) return { line: undefined, skip: 0 };
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
        return { line: `() => { VariableStorage.set("${varName}", [${asciiCodes.join(', ')}]) }`, skip: 0 };
      } else {
        return { line: `() => { VariableStorage.set("${varName}", [${res.slice(2).join(', ')}]) }`, skip: 0 };
      }
    }

    case '#': {
      if (res.length < 2) return { line: undefined, skip: 0 };
      if (/^\d+$/.test(res[1])) {
        return { line: `() => { console.log(${res[1]}) }`, skip: 0 };
      }
      return { line: `() => { console.log(VariableStorage.get("${res[1]}")) }`, skip: 0 };
    }

    case '!': {
      if (res.length < 2) return { line: undefined, skip: 0 };
      const expr = res.slice(1).join(' ').trim();
      const quote = expr[0];
      if ((quote === '"' || quote === "'") && expr.endsWith(quote)) {
        return { line: `() => { console.log(${expr}) }`, skip: 0 };
      }
      return { line: `() => { console.log(getTextMiniRipACHIII(VariableStorage.get("${expr}"))) }`, skip: 0 };
    }

    // math operators: +, -, *, /, %
   case '+':
case '-':
case '*':
case '/':
case '%': {
  if (res.length < 3) return { line: undefined, skip: 0 };
  const op = firstChar;

  
  const rightOperand = /\D/.test(res[2]) 
    ? `VariableStorage.get("${res[2]}")` 
    : res[2];

  return {
    line: `() => {
      const leftVal = VariableStorage.get("${res[1]}");
      const rightVal = ${rightOperand};
      
      if (Array.isArray(leftVal) && !Array.isArray(rightVal)) {
        // leftVal — массив, rightVal — скаляр: применяем операцию к каждому элементу массива
        VariableStorage.set("${res[1]}", leftVal.map(e => e ${op} rightVal));
      } else if (!Array.isArray(leftVal) && !Array.isArray(rightVal)) {
        // оба скаляры
        VariableStorage.set("${res[1]}", leftVal ${op} rightVal);
      } else {
        // другие случаи — например, массив + массив или скаляр + массив — можно расширить логику при необходимости
        throw new Error("Unsupported operation for given operand types");
      }
    }`,
    skip: 0
  };
}


    // label definition
    case '&': {
      if (res.length < 2) return { line: undefined, skip: 0 };
      return { line: `() => { /* label ${res[1]} */ }`, skip: 0 };
    }

    // jump to label
    case '^': {
      if (res.length < 2) return { line: undefined, skip: 0 };
      return { line: `() => { jump('${res[1]}') }`, skip: 0 };
    }

    // conditional sigils: =, <, >
    case '=':
    case '<':
    case '>': {
      if (res.length < 4) return { line: undefined, skip: 0 };
      const op = firstChar;
      let jsOp;
      if (op === "=") {
        jsOp = "===";
      }
      const left = /\D/.test(res[2]) ? `VariableStorage.get("${res[2]}")` : res[2];
      const right = /\D/.test(res[3]) ? `VariableStorage.get("${res[3]}")` : res[3];
      return {
        line: `() => { (${left} ${jsOp} ${right}) ? VariableStorage.set("${res[1]}", 1) : VariableStorage.set("${res[1]}", 0) }`,
        skip: 0
      };
    }

    // OR operation ':'
    case ':': {
      if (res.length < 3) return { line: undefined, skip: 0 };
      const target = res[1];
      const args = res.slice(2).map(arg =>
        /\D/.test(arg) ? `VariableStorage.get("${arg}")` : `${Number(arg)}`
      );
      return {
        line: `() => {
  const values = [${args.join(', ')}];
  const hasOne = values.some(v => Number(v) === 1);
  VariableStorage.set("${target}", hasOne ? 1 : 0);
}`,
        skip: 0
      };
    }

    // AND operation ';'
    case ';': {
      if (res.length < 3) return { line: undefined, skip: 0 };
      const target = res[1];
      const args = res.slice(2).map(arg =>
        /\D/.test(arg) ? `VariableStorage.get("${arg}")` : `${Number(arg)}`
      );
      return {
        line: `() => {
  const values = [${args.join(', ')}];
  const allOnes = values.every(v => Number(v) === 1);
  VariableStorage.set("${target}", allOnes ? 1 : 0);
}`,
        skip: 0
      };
    }

    
    case '?': {
      if (res.length < 3) return { line: undefined, skip: 0 };
     let condition: string | number;
      if (/\D/.test(res[1])) { 
        condition  = `"${res[1]}"`;
      }  else {
          condition = parseInt(res[1]);
      }
      const count = parseInt(res[2]);
      const thenLines: string[] = [];

      for (let j = 1; j <= count; j++) {
        if (index + j >= lines.length) break;
        const result = lexing(lines, index + j);
        if (result?.line) {
          // Видаляємо "() => { ... }"
          const body = result.line.trim().replace(/^.*?\{([\s\S]*)\}$/, '$1').trim();
          thenLines.push(body);
        }
      }

      const block = `
() => {
  const cond = isNaN(${condition}) ? VariableStorage.get(${condition}) : Number(${condition});
  if (cond === 1) {
    ${thenLines.join('\n    ')}
  }
}
`.trim();

      return { line: block, skip: count };
    }
    case "|": {
      const block = `() => {VariableStorage.set("${res[1]}", toASCII(prompt("please input a value of ${res[1]}")))}`
      return {line: block, skip: 0}
    }
    default:
      return { line: undefined, skip: 0 };
  }
};



const getLines = (source: string): string[] => source.trim().split('\n');
