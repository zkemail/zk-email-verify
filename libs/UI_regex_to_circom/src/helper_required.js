// This file is for NECESSARY helper functions to parse/ simplify parameters before going into main DFA generating function (both tagged and non-tagged)
//===========================================================================================================
const a2z = "a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z";
const A2Z = "A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z";
const r0to9 = "0|1|2|3|4|5|6|7|8|9";
const alphanum = `${a2z}|${A2Z}|${r0to9}`;

const key_chars = `(${a2z})`;
const catch_all =
  "(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|!|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|,|-|.|\\/|:|;|<|=|>|\\?|@|\\[|\\\\|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)";
// Not the same: \\[ and ]
const catch_all_without_semicolon =
  "(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|!|\"|#|$|%|&|'|\\(|\\)|\\*|\\+|,|-|.|\\/|:|<|=|>|\\?|@|\\[|\\\\|]|^|_|`|{|\\||}|~| |\t|\n|\r|\x0b|\x0c)";

const email_chars = `${alphanum}|_|.|-`;
const base_64 = `(${alphanum}|\\+|\\/|=)`;
const word_char = `(${alphanum}|_)`;

const a2z_nosep = "abcdefghijklmnopqrstuvwxyz";
const A2Z_nosep = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const a2f_nosep = "abcdef";
const A2F_nosep = "ABCDEF";
const r0to9_nosep = "0123456789";
const email_address_regex = `([a-zA-Z0-9._%\\+-]+@[a-zA-Z0-9.-]+.[a-zA-Z0-9]+)`;

// TODO: Note that this is replicated code in lexical.js as well
// Note that ^ has to be manually replaced with \x80 in the regex
const escapeMap = { n: "\n", r: "\r", t: "\t", v: "\v", f: "\f" };
let whitespace = Object.values(escapeMap);
const slash_s = whitespace.join("|");

// =================================== Parse Param region =========================================
// Parse a certain format of regex
export function simplifyRegex(str) {
  // console.log("inside regex: ", str.replace(/\\\\/g, "\\"));
  // str = str.replace(/\\\\/g, "\\");
  // Replace all A-Z with A2Z etc
  let combined_nosep = str
    .replaceAll("A-Z", A2Z_nosep)
    .replaceAll("a-z", a2z_nosep)
    .replaceAll("A-F", A2F_nosep)
    .replaceAll("a-f", a2f_nosep)
    .replaceAll("0-9", r0to9_nosep)
    .replaceAll("\\w", A2Z_nosep + r0to9_nosep + a2z_nosep + "_")
    .replaceAll("\\d", r0to9_nosep)
    .replaceAll("\\s", slash_s);

  function addPipeInsideBrackets(str) {
    let result = "";
    let insideBrackets = false;
    let index = 0;
    let currChar;
    let immediate = false;
    while (true) {
      currChar = str[index];
      if (index >= str.length) {
        break;
      }
      if (currChar === "[") {
        result += "(";
        insideBrackets = true;
        index++;
        immediate = true;
        continue;
      } else if (currChar === "]") {
        currChar = insideBrackets ? ")" : currChar;
        insideBrackets = false;
      }
      if (currChar === "\\") {
        index++;
        currChar = str[index];
        // in case with escape +
        // add extra layer of \\ since it needs to be parsed into simplifyPlus function
        if (currChar === "+") {
          currChar = "\\+";
        }
        if (currChar === "*") {
          currChar = "\\*";
        }
        if (currChar === "/") {
          currChar = "\\/";
        }
        if (currChar === "?") {
          currChar = "\\?";
        }
        if (currChar === "(") {
          currChar = "\\(";
        }
        if (currChar === ")") {
          currChar = "\\)";
        }
        if (currChar === "[") {
          currChar = "\\[";
        }
        if (currChar === "\\") {
          currChar = "\\\\";
        }
        if (currChar === "|") {
          currChar = "\\|";
        }
        // else if (currChar === "n") {
        //   currChar = "\\n";
        // } else if (currChar === "t") {
        //   currChar = "\\t";
        // } else if (currChar === "r") {
        //   currChar = "\\r";
        // }
      }
      if (immediate) {
        result += currChar;
      } else {
        result += insideBrackets ? "|" + currChar : currChar;
      }
      immediate = false;
      index++;
    }
    // return result.replaceAll("(|", "(");
    return result;
  }
  //   console.log("adsfad: ", addPipeInsideBrackets(combined_nosep));
  return addPipeInsideBrackets(combined_nosep);
}
// Parse + in regex like a+ to include both (a) and (a*), giving submatch that includes
// all alphabet in + correctly
export function simplifyPlus(regex, submatches) {
  let stack = [];
  let new_submatches = {};
  // console.log("gen dfa: ", submatches);
  for (const submatch of submatches) {
    new_submatches[submatch] = [[...submatch]];
  }

  // console.log("og submatch: ", new_submatches);
  let numStack = 0;
  let index_para = {};
  let i = 0;
  while (i < regex.length) {
    // console.log("char: ", i, " :  ", regex[i]);
    if (regex[i] == "\\") {
      stack.push(regex[i]);
      stack.push(regex[i + 1]);
      i += 2;
      continue;
    }
    if (regex[i] == "(") {
      numStack += 1;
      index_para[numStack] = stack.length;
    }
    if (regex[i] == ")") {
      numStack -= 1;
    }
    if (regex[i] == "+") {
      let popGroup = "";
      let j = stack.length - 1;
      // consolidate from each alphabet to one string
      while (j >= index_para[numStack + 1]) {
        // popGroup = stack.pop() + popGroup;
        popGroup = stack[j] + popGroup;
        j -= 1;
      }

      // console.log("len pop: ", popGroup.length);
      // console.log("curr i: ", i);
      // console.log("pop len: ", popGroup.length);
      // console.log("i regex: ", i);
      for (const key in new_submatches) {
        // console.log("key sp: ", key.split(",")[1]);
        // console.log("border: ", index_para[numStack + 1]);
        // if submatch in that () that got extended by +
        let len_before = new_submatches[key].length;

        if (
          key.split(",")[1] > index_para[numStack + 1] &&
          key.split(",")[1] <= i - 1
        ) {
          // console.log("bef: ", new_submatches);
          for (let k = 0; k < len_before; k++) {
            new_submatches[key].push([
              new_submatches[key][k][0] + popGroup.length,
              new_submatches[key][k][1] + popGroup.length,
            ]);
          }
          // console.log("aff1: ", submatches);
        }
        // if submatch end is affected  by enlarging this group
        else if (key.split(",")[1] > i) {
          // console.log("b2: ", submatches);
          for (let k = 0; k < len_before; k++) {
            if (key.split(",")[0] > i) {
              new_submatches[key][k][0] += popGroup.length;
            }
            new_submatches[key][k][1] += popGroup.length;
          }
          // console.log("aff2: ", submatches);
        }
        // console.log("NEW SUB: ", new_submatches);
      }

      popGroup = popGroup + "*";
      // console.log("curr Stack: ", stack);
      // console.log("popGroup ", popGroup);
      stack.push(popGroup);
      // console.log("stack after: ", stack);
      i += 1;
      continue;
    }
    stack.push(regex[i]);
    i += 1;
  }

  let almost_submatches = [];
  // console.log("b4: ", submatches);
  // console.log("b5: ", new_submatches);
  for (const submatch of submatches) {
    almost_submatches.push(new_submatches[submatch[0] + "," + submatch[1]]);
  }
  let regex_for_parse = stack.join("");
  let regex_for_show = "";
  let escape_pos = [];
  //   for (let i = 0; i < regex_for_parse.length; i++) {
  //     if (regex_for_parse[i] != "\\") {
  //       regex_for_show += regex_for_parse[i];
  //     } else {
  //       escape_pos.push(i);
  //     }
  //   }
  let count_index = 0;
  while (count_index < regex_for_parse.length) {
    if (regex_for_parse[count_index] == "\\") {
      escape_pos.push(count_index);
      count_index += 1;
    }
    regex_for_show += regex_for_parse[count_index];
    count_index += 1;
  }
  escape_pos.sort((a, b) => a - b);

  // just binary search
  function findIndex(arr, num) {
    let left = 0;
    let right = arr.length - 1;
    let mid = 0;

    while (left <= right) {
      mid = Math.floor((left + right) / 2);

      if (arr[mid] < num) {
        left = mid + 1;
      } else if (arr[mid] > num) {
        right = mid - 1;
      } else {
        return mid;
      }
    }

    return arr[mid] < num ? mid + 1 : mid;
  }

  let final_submatches = [];
  for (const group of almost_submatches) {
    let group_arr = [];
    for (const index of group) {
      group_arr.push([
        index[0] - findIndex(escape_pos, index[0]),
        index[1] - findIndex(escape_pos, index[1]),
      ]);
    }
    final_submatches.push(group_arr);
  }
  // console.log("almost: ", almost_submatches);
  // console.log("final sub: ", final_submatches);
  return {
    regex: regex_for_parse,
    submatches: almost_submatches,
    regex_show: regex_for_show,
    final_submatches: final_submatches,
  };
}
export function toNature(col) {
  let i,
    j,
    base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    result = 0;
  if ("1" <= col[0] && col[0] <= "9") {
    result = parseInt(col, 10);
  } else {
    for (i = 0, j = col.length - 1; i < col.length; i += 1, j -= 1) {
      result += Math.pow(base.length, j) * (base.indexOf(col[i]) + 1);
    }
  }
  return result;
}
// ============================ Format graph before creating circom ==============================

// call after final graph of tagged dfa e.g.
// final:  {
//     states: Set(13) {
//       '0',  '1', '2',  '3',
//       '4',  '5', '6',  '7',
//       '8',  '9', '10', '11',
//       '12'
//     },
//     alphabets: Set(15) {
//       'D',
//       '/',
//       '1',
//       '2',
//       ';',
//       ' ',
//       'K',
//       'I',
//       ':',
//       'a',
//       'd',
//       'v',
//       '=',
//       'b',
//       'h'
//     },
//     start_state: '0',
//     accepted_states: Set(1) { '12' },
//     transitions: {
//       '0': { D: '4' },
//       '1': { '1': '1', '2': '1', '/': '1', ';': '2' },
//       '2': { ' ': '3' },
//       '3': { b: '11', a: '9', d: '9', v: '9' },
//       '4': { K: '5' },
//       '5': { I: '6' },
//       '6': { ':': '7' },
//       '7': { ' ': '8' },
//       '8': { a: '9', d: '9', v: '9' },
//       '9': { '=': '10' },
//       '10': { '1': '1', '2': '1', '/': '1' },
//       '11': { h: '12' },
//       '12': {}
//     },
//     tags: {
//       '0': Set(7) {
//         '["8","9"]',
//         '["3","9"]',
//         '["9","10"]',
//         '["10","1"]',
//         '["1","2"]',
//         '["2","3"]',
//         '["1","1"]'
//       },
//       '1': Set(2) { '["8","9"]', '["3","9"]' },
//       '2': Set(2) { '["10","1"]', '["1","1"]' }
//     }
//   }

// This function formats transition into forward and backward, with list of transitions that lead to same state
export function formatForCircom(final_graph) {
  let og_transitions = final_graph["transitions"];
  let forward_transitions = {};
  let rev_transitions = Array.from(
    { length: final_graph["states"].size },
    () => []
  );
  for (let node in og_transitions) {
    forward_transitions[node] = {};
    let memState = {};
    for (const alp in og_transitions[node]) {
      if (!memState.hasOwnProperty(og_transitions[node][alp])) {
        memState[og_transitions[node][alp]] = [];
      }
      memState[og_transitions[node][alp]].push(alp);
      // Not sort to see original value
      // memState[og_transitions[node][alp]].sort();
    }

    for (const toState in memState) {
      forward_transitions[node][JSON.stringify(memState[toState])] = toState;
    }
  }
  for (let node in forward_transitions) {
    for (let arr in forward_transitions[node]) {
      rev_transitions[parseInt(forward_transitions[node][arr])].push([
        arr,
        node,
      ]);
    }
  }
  // Print: uncomment to print forward_tran, rev_tran after concatenating alphabets that cause the same state transition
  // console.log("og tran: ", og_transitions);
  // console.log("forward_tran: ", forward_transitions);
  // console.log("rev_tran: ", rev_transitions);

  // Careful!, it modifies final_graph
  final_graph["forward_transitions"] = forward_transitions;
  final_graph["rev_transitions"] = rev_transitions;
  return final_graph;
}
