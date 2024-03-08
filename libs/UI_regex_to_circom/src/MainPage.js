import React, { useState, useEffect } from "react";
import styled, { CSSProperties } from "styled-components";
import { useUpdateEffect } from "react-use";
import { RegexInput } from "./components/RegexInput";
import { TextInput } from "./components/TextInput";
import { Button } from "./components/Button";
import { Highlighter } from "./components/Highlighter";
import { saveAs } from "file-saver";
import { genInputzkRepl } from "./gen_msg_zkrepl";
import { gen_circom } from "./gen_circom";
import { simplifyGraph, findSubstrings } from "./gen_dfa";
import { simplifyRegex } from "./helper_required";
import { tagged_simplifyGraph, getTaggedResult } from "./gen_tagged_dfa";
export const MainPage = () => {
  // to be input in the future
  //   const testText = "hello Jern ja I'm here";
  //   const testRegex = "(h|e|l|o)*";
  const [convertActive, setConvertActive] = useState(false);

  //============================ highlight states
  const [userHighlights, setUserHighlights] = useState({});
  const [staticHighlights, setStaticHighlights] = useState([]);
  const [userColors, setUserColors] = useState({});
  const [newHighlight, setNewHighlight] = useState({});
  const [newColor, setNewColor] = useState({});

  //============================= text states
  const [text, setText] = useState("");
  //============================ regex states
  const [regex, setRegex] = useState("");
  const [simpleRegex, setSimpleRegex] = useState("");
  const [displayMessage, setDisplayMessage] = useState("Match RegEx!");

  //============================ DFA states
  const [rawDFA, setRawDFA] = useState({
    accepted_states: new Set(),
    alphabets: new Set(),
    or_sets: new Set(),
    start_state: "",
    states: [],
    transitions: {},
  });
  const [AllDFAHighlights, setAllDFAHighlights] = useState({});
  // =============================Submatches
  const [newSubmatches, setNewSubmatches] = useState({});
  const [submatchesArr, setSubmatchesArr] = useState([]);
  const [tagDict, setTagDict] = useState({});
  const [groupMatch, setGroupMatch] = useState([]);

  //==============================zkREPL
  const [replMsg, setReplMsg] = useState("");
  const [replMsgLen, setReplMsgLen] = useState("");

  function replaceSpecialChar(string) {
    return String.raw`${string}`
      .replace(/(\\+)(n)/g, (match, backslashes, n) => {
        if (backslashes.length % 2 === 0) {
          // Even number of backslashes before n
          return "\\".repeat(backslashes.length) + "n";
        } else {
          // Odd number of backslashes before n
          return "\\".repeat(backslashes.length - 1) + "\n";
        }
      })
      .replace(/(\\+)(t)/g, (match, backslashes, n) => {
        if (backslashes.length % 2 === 0) {
          // Even number of backslashes before t
          return "\\".repeat(backslashes.length) + "t";
        } else {
          // Odd number of backslashes before t
          return "\\".repeat(backslashes.length - 1) + "\t";
        }
      })
      .replace(/(\\+)(r)/g, (match, backslashes, n) => {
        if (backslashes.length % 2 === 0) {
          // Even number of backslashes before r
          return "\\".repeat(backslashes.length) + "r";
        } else {
          // Odd number of backslashes before r
          return "\\".repeat(backslashes.length - 1) + "\r";
        }
      })
      .replace(/(\\+)(v)/g, (match, backslashes, n) => {
        if (backslashes.length % 2 === 0) {
          // Even number of backslashes before v
          return "\\".repeat(backslashes.length) + "v";
        } else {
          // Odd number of backslashes before v
          return "\\".repeat(backslashes.length - 1) + "\v";
        }
      })
      .replace(/(\\+)(f)/g, (match, backslashes, n) => {
        if (backslashes.length % 2 === 0) {
          // Even number of backslashes before f
          return "\\".repeat(backslashes.length) + "f";
        } else {
          // Odd number of backslashes before f
          return "\\".repeat(backslashes.length - 1) + "\f";
        }
      });
  }
  function generateSegments(regex) {
    const graph = simplifyGraph(replaceSpecialChar(regex));
    return findSubstrings(graph, text);
  }
  function generateTaggedDFA(regex, submatches) {
    const tagged_simp_graph = tagged_simplifyGraph(
      replaceSpecialChar(regex),
      submatches
    );

    const matched_dfa = generateSegments(replaceSpecialChar(regex));
    let tagged_dictionary = {};
    for (const subs of matched_dfa[1]) {
      let matched = text.slice(subs[0], subs[1] + 1);
      tagged_dictionary[matched] = {};
      let tag_result = getTaggedResult(matched, tagged_simp_graph);
      // now iterate through each tag result
      for (let index in tag_result) {
        tagged_dictionary[matched][index] = [];
        for (
          let groupInd = 0;
          groupInd < tag_result[index].length;
          groupInd++
        ) {
          tagged_dictionary[matched][index].push(
            matched.slice(
              tag_result[index][groupInd][0],
              tag_result[index][groupInd][0] +
                tag_result[index][groupInd].length
            )
          );
        }
      }
    }
    setTagDict(tagged_dictionary);
    console.log("result tagged dict: ", tagged_dictionary);
  }
  // ========================= DFA function ======================
  function handleGenerateDFA() {
    // Generate graph parameters

    const graph = simplifyGraph(replaceSpecialChar(regex));
    setRawDFA(graph);
  }
  function handleGenerateSimpleRegex() {
    // console.log("b4: ", regex);
    // console.log("simppp: ", simplifyRegex(regex));
    // console.log("simp22: ", simplifyRegex(regex.replace(/\\n/g, "\n")));

    // console.log("b4 simplify regex: ", replaceSpecialChar(regex));

    // console.log(
    //   "after simplify regex: ",
    //   simplifyRegex(replaceSpecialChar(regex))
    // );

    setSimpleRegex(simplifyRegex(replaceSpecialChar(regex)));
  }

  useEffect(() => {
    // Renders accepted segments & create full Regex
    if (convertActive) {
      handleGenerateDFA();
      handleGenerateSimpleRegex();
      //   console.log("DFA ", rawDFA); // rawDFA is always behind???? we need some argument to pass this in at a timely manner
      handleUpdateStaticHighlight();
      setConvertActive(false);
    }
  }, [convertActive]);

  // =================== Text Highlight Functions ===========

  function handleUpdateStaticHighlight() {
    // Displaying accepted segments in input text after Regex.
    const indices = generateSegments(regex)[1];
    // console.log("jern indices: ", indices);
    // console.log("reached");
    setStaticHighlights(indices);
  }

  function handleUpdateHighlight(newData) {
    // console.log("new data: ", newData);
    setNewSubmatches((prevState) => {
      const updatedSubmatches = { ...prevState, ...newData };
      return updatedSubmatches;
    });
  }
  function handleUpdateSubmatch(newSubmatches) {
    // console.log("submatch change to ", newSubmatches);
    // sort dictionary into array linked
    let submatches_arr = [];
    let key_arr = [];
    for (let key in newSubmatches) {
      key_arr.push(key);
      submatches_arr.push([
        parseInt(newSubmatches[key][0]),
        parseInt(newSubmatches[key][1]),
      ]);
    }
    const original = submatches_arr.slice();
    submatches_arr.sort((a, b) => a[0] - b[0]);
    console.log("new Submatches Array: ", submatches_arr);
    setSubmatchesArr(submatches_arr);
    let shuffledIndex = submatches_arr.map((item) => original.indexOf(item));
    let group_match = [];
    for (let ele of shuffledIndex) {
      group_match.push(key_arr[ele]);
    }
    setGroupMatch(group_match);
    // remember what each how to line up groupy stuffs
  }
  // Show what text corresponds to that group match
  function handleUpdateSubmatchArr(submatchesArr) {
    // console.log("create dfa jyaa ", submatchesArr);
    generateTaggedDFA(regex, submatchesArr);
  }
  function handleUpdateColor(newData) {
    setUserColors((prevState) => {
      const updatedState = { ...prevState, ...newData };
      return updatedState;
    });
  }
  function handleGenerateCircom(event) {
    event.preventDefault();

    const text = gen_circom(replaceSpecialChar(regex), submatchesArr);

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "circom.txt");
  }

  function handleGenMsgRepl(event) {
    event.preventDefault();
    const blob = new Blob(
      [JSON.stringify(genInputzkRepl(replMsg, replMsgLen))],
      { type: "text/plain;charset=utf-8" }
    );
    saveAs(blob, "msg.txt");
  }

  useUpdateEffect(() => {
    handleUpdateHighlight(newHighlight);
  }, [newHighlight]);

  useUpdateEffect(() => {
    handleUpdateColor(newColor);
  }, [newColor]);
  useUpdateEffect(() => {
    handleUpdateSubmatch(newSubmatches);
  }, [newSubmatches]);
  useUpdateEffect(() => {
    handleUpdateSubmatchArr(submatchesArr);
  }, [submatchesArr]);
  return (
    <div>
      <h1>ZK RegEX</h1>
      <a href="https://github.com/JernKunpittaya/full_zk_regex">Repo</a>
      <textInfo>
        <Line>How to use zk RegEx</Line>
        <Line>
          1.Fill the text field with the original text format you want to
          extract subgroup from (have multiple lines and tabs are ok, so just
          copy your interested text.)
        </Line>
        <Line>
          2. Fill the regex field with the regex you want to match but with
          explicit syntax like \n to represent new line instead of using
          original format like the text field. (same for \r, \t, \v,\f)
        </Line>
        <Line>Escape chars are escaped with \ e.g. \”, \*, \+, ...</Line>
        <Line>
          3. When defining regex with * and + for subgroup match, write () over
          that subgroup we are interested in e.g. ((a|b|c)+)
        </Line>
        <Line>
          4. Click Match RegEx! to see where in the text that are matched by our
          regex
        </Line>
        <Line>
          5. Highlight "Regex to be Highlighted" by clicking "Begin Regex
          Highlight", then choose two points as subgroup inclusive boundary we
          want to match, then click "End Regex Highlight" to name the subgroup
          we are extracting.
        </Line>
        <Line>6. Repeat Step 5, If done, just "Download Circom" and DONE!</Line>
        <Line>
          7. We also have msg generator at the bottom, in case you want to
          generate msg for testing with zkrepl.dev{" "}
        </Line>
      </textInfo>
      <Container>
        <TextInput
          label="Enter your text here:"
          value={text}
          onChange={(e) => {
            //   console.log("text input: ");
            //   console.log(JSON.stringify(text));
            // setText(e.currentTarget.value.replace(/\n/g, "\r\n"));
            setText(e.currentTarget.value);
          }}
        />
        {/* <pre>{text}</pre> */}
        <RegexInput
          label="Enter your regex here:"
          value={regex}
          onChange={(e) => {
            console.log("regex input: ");
            console.log(e.currentTarget.value);
            console.log(String.raw`${e.currentTarget.value}`);
            setRegex(e.currentTarget.value);
            // console.log("regex stored: ", regex);
          }}
        />
        <Button
          disabled={displayMessage != "Match RegEx!" || regex.length === 0}
          onClick={async () => {
            //   console.log("yes");
            setConvertActive(true);
            setDisplayMessage("Match RegEx!");
          }}>
          {displayMessage}
        </Button>
        {/* <h4>{regex}</h4>
      <h4>{simpleRegex}</h4> */}
        <Highlighter
          sampleText={text}
          sampleRegex={simpleRegex}
          newHighlight={{}}
          setNewHighlight={setNewHighlight}
          newColor={{}}
          setNewColor={setNewColor}
          staticHighlights={staticHighlights}
        />{" "}
        <div>
          <h3 style={{ padding: 0 }}>Extracted Subgroup:</h3>
          <div
            style={{
              margin: "20px 0",
              padding: "10px",
              border: "1px solid white",
              padding: 0,
            }}>
            {Object.entries(tagDict).map(([dfa_match, tag_dict]) => (
              <div style={{ position: "relative", padding: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}>
                  <h4
                    style={{
                      fontWeight: "bold",
                      marginRight: "10px",
                    }}>
                    DFA matched:
                  </h4>
                  <pre>
                    <h4 style={{ fontWeight: "normal" }}>{dfa_match}</h4>
                  </pre>
                </div>
                <div style={{ marginLeft: "50px" }}>
                  {Object.entries(tag_dict).map(([tagNum, content]) => (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}>
                        <h5
                          style={{
                            fontWeight: "bold",
                            marginRight: "10px",
                          }}>
                          {groupMatch[tagNum]}
                        </h5>
                        <h4 style={{ fontWeight: "normal" }}>
                          (Group: {tagNum})
                        </h4>
                      </div>
                      <pre>
                        <div style={{ marginLeft: "50px" }}>
                          {content.map((item) => (
                            <h5>{item}</h5>
                          ))}
                        </div>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleGenerateCircom}>Download Circom</Button>
        <h2 style={{ fontWeight: "normal" }}>Msg generator for zkREPL</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <textarea
            placeholder="msg"
            value={replMsg}
            onChange={(e) => setReplMsg(e.target.value)}
          />
          <input
            style={{ maxWidth: "200px" }}
            type="number"
            placeholder="msg max length"
            value={replMsgLen}
            onChange={(e) => setReplMsgLen(e.target.value)}
          />
          <button style={{ maxWidth: "200px" }} onClick={handleGenMsgRepl}>
            Download msg for zkREPL
          </button>
        </div>
      </Container>
    </div>
  );
};

const TextInfo = styled.div`
  display: flex;
  flex-direction: column;
  @media (min-width: 600px) {
    flex-wrap: nowrap;
  }
`;
const Line = styled.p`
  margin-bottom: 10px;

  @media (min-width: 600px) {
    flex-basis: 50%;
  }
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;

  & .title {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  & .main {
    & .signaturePane {
      flex: 1;
      display: flex;
      flex-direction: column;
      & > :first-child {
        height: calc(30vh + 24px);
      }
    }
  }

  & .bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    & p {
      text-align: center;
    }
    & .labeledTextAreaContainer {
      align-self: center;
      max-width: 50vw;
      width: 500px;
    }
  }
`;
