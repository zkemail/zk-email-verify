import React, { useState, FC } from "react";

// Passes in the final highlighted indices from extracted
// states and makes them pretty!! ... as pretty as this CSS will be, at least.

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
function print_DFA(DFAActiveState) {
  let result = {};
  for (let key in DFAActiveState) {
    if (!(key in result)) {
      result[key] = {};
    }
    // console.log("yo ");
    for (let state in DFAActiveState[key]) {
      // console.log("stattt: ", typeof state);
      // console.log("cb4 ", DFAActiveState[key][state]);
      // console.log("type cb4 ", typeof DFAActiveState[key][state]);
      // console.log("check ", [...DFAActiveState[key][state]]);
      // console.log("type check ", typeof [...DFAActiveState[key][state]]);
      result[key][state] = [...DFAActiveState[key][state]];
    }
  }
  return result;
}

export const HighlightedText = ({
  userHighlights,
  DFAActiveState,
  sampleText,
  userColors,
  staticHighlights,
}) => {
  const standardOpacity = 0.5;
  // console.log("User high: ", userHighlights);
  // console.log("DFA checkky: ", DFAActiveState);
  // parse DFAActiveState

  const printed_DFA = print_DFA(DFAActiveState);
  // console.log("Last DFA: ", printed_DFA);
  // console.log(staticHighlights);
  const colorSegments = Object.entries(userHighlights).map(([id, indices]) => ({
    id,
    segments: indices.flat(),
  }));
  const acceptedIdx = unrollRanges(staticHighlights);
  // console.log(acceptedIdx);
  const rejTextColor = "rgba(100, 100, 100, 1)";
  const accTextColor = "rgba(255, 255, 255, 1)";
  const offTextColor = "rgba(160, 160, 160, 1)";
  const real = acceptedIdx.length > 0;

  return (
    <div>
      <p>
        {sampleText.split("").map((char, index) => {
          const segment = colorSegments.find(({ segments }) =>
            segments.includes(index)
          );
          let color = offTextColor;
          if (real) {
            color = acceptedIdx.includes(index) ? accTextColor : rejTextColor;
          }

          if (segment) {
            // Apply the corresponding color to the character
            const { id, segments } = segment;
            return (
              <mark
                className="highlight"
                key={index}
                style={{
                  backgroundColor: userColors[id],
                  color: color,
                  opacity: standardOpacity,
                }}
              >
                {char}
              </mark>
            );
          } else {
            return (
              <span key={index} style={{ color: color }}>
                {char}
              </span>
            );
          }
        })}
      </p>
      {/* <pre>{JSON.stringify(userHighlights, null, 2)}</pre> */}
      <pre>{JSON.stringify(printed_DFA, null, 2)}</pre>
    </div>
  );
};
