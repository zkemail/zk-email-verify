import React, { useState, FC } from "react";
import { Button } from "./Button";

// Highlight text on a text input and auto-highlight the rest of the text segments
// corresponding to the same DFA states.

const SampleText = "This is a sample text for highlighting.";

// interface props {
//   sampleText: string;
//   newHighlight: HighlightObject;
//   setNewHighlight: React.Dispatch<React.SetStateAction<HighlightObject>>;
//   newColor: ColorObject;
//   setNewColor: React.Dispatch<React.SetStateAction<ColorObject>>;
//   staticHighlights: StaticHighlightObject;
// }

function unrollRanges(ranges) {
  const result = [];
  for (const range of ranges) {
    const [start, end] = range;
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
  }
  return result;
}

export const Highlighter = ({
  sampleText,
  sampleRegex,
  newHighlight,
  setNewHighlight,
  newColor,
  setNewColor,
  staticHighlights,
}) => {
  // console.log("Highlighter regex: ", sampleRegex);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [highlightName, setHighlightName] = useState("");
  // const [allHighlights, setAllHighlights] = useState({})
  const [buttonClick, setButtonClick] = useState(0);
  // const [colors, setColors] = useState({})
  const [curColor, setCurColor] = useState("rgba(0, 0, 0, 1)");
  // const [testingOnly, setTestingOnly] = useState({})
  //   console.log("highl: ", staticHighlights[0]);
  //   console.log("highl: ", staticHighlights[1]);
  //   console.log("highl: ", staticHighlights[2]);
  const acceptedIdx = unrollRanges(staticHighlights);
  //   console.log("accepted idx: ", acceptedIdx);
  const rejTextColor = "rgba(100, 100, 100, 1)";
  const accTextColor = "rgba(255, 255, 255, 1)";
  const offTextColor = "rgba(160, 160, 160, 1)";
  const real = acceptedIdx.length > 0;
  //   console.log("hey jern: ", sampleRegex);
  const handleHighlight = (index) => {
    if (isHighlighting) {
      if (highlightedIndices.includes(index)) {
        setHighlightedIndices((prevState) =>
          prevState.filter((i) => i !== index)
        );
      } else {
        setHighlightedIndices((prevState) => [...prevState, index]);
      }
    }
  };

  const opacity = 0.5;

  const handleBeginHighlight = () => {
    setIsHighlighting(true);
    setButtonClick(buttonClick + 1);
    setCurColor(
      `rgba(${Math.floor(Math.random() * 96 + 160)}, ${Math.floor(
        Math.random() * 96 + 160
      )}, ${Math.floor(Math.random() * 120 + 136)}, ${opacity})`
    );
  };

  const handleEndHighlight = () => {
    setIsHighlighting(false);
    // prompt user to enter name for highlight region
    const name = prompt("Enter highlight name:");
    if (name) {
      setHighlightName(name);
      // check case length = 1
      const condensed =
        highlightedIndices.length === 1
          ? [
              highlightedIndices.sort((a, b) => a - b)[0],
              highlightedIndices.sort((a, b) => a - b)[0] + 1,
            ]
          : [
              highlightedIndices.sort((a, b) => a - b)[0],
              highlightedIndices.sort((a, b) => a - b)[
                highlightedIndices.length - 1
              ],
            ];
      //   console.log("condesedddd: ", name, " : ", condensed);
      const range = (start, end) =>
        Array.from(Array(end - start + 1).keys()).map((x) => x + start);
      // const testing = range(condensed[0], condensed[1])
      // console.log("conddd: ", condensed);
      setNewHighlight({ [name]: condensed });
      setNewColor({ [name]: curColor });
      // setTestingOnly((prevState) => ({...prevState, [name]: testing}));
      setHighlightedIndices([]);
    }
    setButtonClick(buttonClick + 1);
  };

  return (
    <div>
      <div>
        <h4>Regex matched:</h4>
        <pre>
          {sampleText.split("").map((char, index) => {
            let color = offTextColor;
            if (real) {
              color = acceptedIdx.includes(index) ? accTextColor : rejTextColor;
            }
            return (
              <span
                key={index}
                style={{
                  color: color,
                }}>
                {char}
              </span>
            );
          })}
        </pre>
      </div>
      <div>
        <h4>Regex to be highlighted:</h4>
        <pre>
          {sampleRegex.split("").map((char, index) => {
            let color = offTextColor;
            return (
              <span
                key={index}
                style={{
                  backgroundColor: highlightedIndices.includes(index)
                    ? curColor
                    : "transparent",
                  color: color,
                }}
                onClick={() => handleHighlight(index)}>
                {char}
              </span>
            );
          })}
        </pre>
      </div>

      <Button
        style={{ marginTop: "20px" }}
        onClick={isHighlighting ? handleEndHighlight : handleBeginHighlight}>
        {isHighlighting ? "End Regex Highlight" : "Begin Regex Highlight"}
      </Button>
    </div>
  );
};
