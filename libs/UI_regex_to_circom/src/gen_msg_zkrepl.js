// This file is for generating array of character's ascii code of the string we are interested in
// Mainly for using as the input to test in zkrepl.dev
//=================================================================================
export function genInputzkRepl(text, len) {
  let result = [];
  let extra = 0;
  for (let i = 0; i < text.length; i++) {
    // if (text == "\n") {
    //   result.push("\r".toString());
    //   extra += 1;
    // }
    result.push(text.charCodeAt(i).toString());
  }
  for (let j = text.length + extra; j < len; j++) {
    result.push("");
  }
  // console.log("ress: ", result);
  return result;
}

// module.exports = { genInputzkRepl };
