// NB! fails to properly parse nested comments (should be rare enough though)

interface Part {
  [key: string]: string;
}

const valueParser = (str: string) => {
  let line = str.replace(/\s+/g, ' ').trim();

  let parts: Part[] = [];
  let lastState: string | boolean = false;

  const createPart = () => {
    let part: Part = {
      key: '',
      value: '',
    };
    parts.push(part);
    return part;
  };

  const parse = () => {
    let state = 'key';
    let escaped;
    let quote;

    let curPart = createPart();

    for (let i = 0; i < line.length; i++) {
      let c = line.charAt(i);

      switch (state) {
        // @ts-ignore
        case 'key':
          if (c === '=') {
            state = 'value';
            break;
          }
        // falls through

        case 'value': {
          if (escaped === true) {
            curPart[state] += c;
            break;
          }

          switch (c) {
            case ' ':
              // start new part
              curPart = createPart();
              state = 'key';
              break;

            case '\\':
              escaped = true;
              break;

            case '"':
            case "'":
              lastState = state;
              state = 'quoted';
              quote = c;
              break;

            default:
              curPart[state] += c;
              break;
          }

          break;
        }

        case 'quoted':
          if (escaped === true && typeof lastState === 'string') {
            curPart[lastState] += c;
            break;
          }

          switch (c) {
            case '\\':
              escaped = true;
              break;

            case quote:
              state = lastState as string;
              break;

            default:
              if (typeof lastState === 'string') {
                curPart[lastState] += c;
              }
              break;
          }

          break;
      }
    }

    let result: { [key: string]: any } = {
      value: parts[0].key,
    };
    parts.slice(1).forEach((part) => {
      if (part.key || part.value) {
        let path = part.key.split('.');
        let curRes = result;
        let final = path.pop();
        for (let p of path) {
          if (typeof curRes[p] !== 'object' || !curRes[p]) {
            curRes[p] = {};
          }
          curRes = curRes[p];
        }
        curRes[final ?? ''] = part.value;
      }
    });

    return result;
  };

  return parse();
};

const headerParser = (buf: Buffer | string) => {
  let line = (buf || '').toString().trim();
  let splitterPos = line.indexOf(':');
  let headerKey: string;
  if (splitterPos >= 0) {
    headerKey = line.substr(0, splitterPos).trim().toLowerCase();
    line = line.substr(splitterPos + 1).trim();
  }

  let parts: { [key: string]: any }[] = [];
  let lastState: string | boolean = false;

  const createPart = (): { [key: string]: string | boolean } => {
    let part = {
      key: '',
      value: '',
      comment: '',
      hasValue: false,
    };
    parts.push(part);
    return part;
  };

  const parse = () => {
    let state = 'key';
    let escaped;
    let quote;

    let curPart = createPart();

    for (let i = 0; i < line.length; i++) {
      let c = line.charAt(i);

      switch (state) {
        // @ts-ignore
        case 'key':
          if (c === '=') {
            state = 'value';
            curPart.hasValue = true;
            break;
          }
        // falls through

        case 'value': {
          if (escaped === true) {
            curPart[state] += c;
          }

          switch (c) {
            case ';':
              // start new part
              curPart = createPart();
              state = 'key';
              break;

            case '\\':
              escaped = true;
              break;

            case '(':
              lastState = state;
              state = 'comment';
              break;

            case '"':
            case "'":
              lastState = state;
              curPart[state] += c;
              state = 'quoted';
              quote = c;
              break;

            default:
              curPart[state] += c;
              break;
          }

          break;
        }

        case 'comment':
          switch (c) {
            case '\\':
              escaped = true;
              break;

            case ')':
              state = lastState as string;
              break;

            default:
              curPart[state] += c;
              break;
          }

          break;

        case 'quoted':
          switch (c) {
            case '\\':
              escaped = true;
              break;
            // @ts-ignore
            case quote:
              state = lastState as string;
            // falls through

            default:
              if (typeof lastState === 'string') {
                curPart[lastState] += c;
              }
              break;
          }

          break;
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      for (let key of Object.keys(parts[i])) {
        if (typeof parts[i][key] === 'string') {
          parts[i][key] = parts[i][key].replace(/\s+/g, ' ').trim();
        }
      }

      parts[i].key = parts[i].key.toLowerCase();

      if (!parts[i].key) {
        // remove empty value
        parts.splice(i, 1);
      } else if (['bh', 'b', 'p', 'h'].includes(parts[i].key)) {
        // remove unneeded whitespace
        parts[i].value = parts[i].value?.replace(/\s+/g, '');
      } else if (['l', 'v', 't'].includes(parts[i].key) && !isNaN(parts[i].value)) {
        parts[i].value = Number(parts[i].value);
      } else if (parts[i].key === 'i' && /^arc-/i.test(headerKey)) {
        parts[i].value = Number(parts[i].value);
      }
    }

    let result: { [key: string]: any } = {
      header: headerKey,
    };

    for (let i = 0; i < parts.length; i++) {
      // find the first entry with key only and use it as the default value
      if (parts[i].key && !parts[i].hasValue) {
        result.value = parts[i].key;
        parts.splice(i, 1);
        break;
      }
    }

    parts.forEach((part) => {
      let entry: { [key: string]: any } = {
        value: part.value,
      };

      if (
        ['arc-authentication-results', 'authentication-results'].includes(headerKey) &&
        typeof part.value === 'string'
      ) {
        // parse value into subparts as well
        entry = Object.assign(entry, valueParser(entry.value));
      }

      if (part.comment) {
        entry.comment = part.comment;
      }

      if (['arc-authentication-results', 'authentication-results'].includes(headerKey) && part.key === 'dkim') {
        if (!result[part.key]) {
          result[part.key] = [];
        }
        if (Array.isArray(result[part.key])) {
          result[part.key].push(entry);
        }
      } else {
        result[part.key] = entry;
      }
    });

    return result;
  };

  return { parsed: parse(), original: buf };
};

export default headerParser;
