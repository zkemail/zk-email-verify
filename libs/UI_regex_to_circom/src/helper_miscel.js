// This file is for helper functions that help in reading our code, but not necessary
//==============================================================================
import { simplifyRegex, simplifyPlus } from "./helper_required";
import { simplifyGraph, findSubstrings } from "./gen_dfa";
import { getTaggedResult, tagged_simplifyGraph } from "./gen_tagged_dfa";
//=================================== Easy Reading region =================================

// function to read how submatches correspond to the subgroup we are interested in
export function readSubmatch(regex, submatches) {
  regex = simplifyRegex(regex);
  // console.log("og regex: ", regex);
  let after_plus = simplifyPlus(regex, submatches);
  // console.log("after plus: ", after_plus);
  let final_regex = after_plus["regex_show"];
  let final_submatches = after_plus["final_submatches"];
  // console.log("og submatch: ", submatches);
  // console.log("after submatch: ", final_submatches);

  console.log("len regex: ", regex.length);
  const index_color = {};
  const index_full = {};
  const color_arr = [];
  const defaultColor = "\x1b[0m";

  // color of original regex
  for (let i = 0; i < submatches.length; i++) {
    // the actual index of left is leftmost, right is rightmost
    const color = `\x1b[${(i % 7) + 31}m`;
    index_color[submatches[i][0]] = color;
    index_color[submatches[i][1]] = color;
    color_arr.push(color);
  }
  const sortedIndex = Object.keys(index_color).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });
  let result = "";
  let prev = 0;
  for (const index of sortedIndex) {
    result += regex.slice(prev, parseInt(index)) + index_color[index];
    result += regex[index] + defaultColor;
    prev = parseInt(index) + 1;
  }
  result += regex.slice(prev);

  // color of final regex
  for (let i = 0; i < final_submatches.length; i++) {
    // the actual index of left is leftmost, right is rightmost
    const color = `\x1b[${(i % 7) + 31}m`;
    for (let match of final_submatches[i]) {
      index_full[match[0]] = color;
      index_full[match[1]] = color;
    }
  }
  const final_sortedIndex = Object.keys(index_full).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });
  let final_result = "";
  let final_prev = 0;
  for (const index of final_sortedIndex) {
    final_result +=
      final_regex.slice(final_prev, parseInt(index)) + index_full[index];
    final_result += final_regex[index] + defaultColor;
    final_prev = parseInt(index) + 1;
  }
  final_result += final_regex.slice(final_prev);

  // group color
  let group_color = "Group: ";
  for (let i = 0; i < color_arr.length; i++) {
    group_color += color_arr[i] + i + defaultColor + ", ";
  }
  console.log(group_color.slice(0, group_color.length - 2));
  console.log("input regex: ", result);
  console.log("final regex: ", final_result);
}

// simplify M1 to readable format, not just node points to each other
export function simplifyM1(m1) {
  function read_M1(m1, q1, trans, accepted) {
    if (q1.has(m1.id)) {
      // console.log("exist already, id: ", m1.id);
      return;
    } else {
      q1.add(m1.id);
    }
    if (m1.type == "accept") {
      accepted.push(m1.id);
      return;
    }
    for (let i = 0; i < m1.edges.length; i++) {
      // console.log("edge of ", m1.id, " : ", m1.edges[i][0]);
      if (!trans.hasOwnProperty(m1.id)) {
        trans[m1.id] = {};
      }
      trans[m1.id][m1.edges[i][0].toString()] = m1.edges[i][1].id.toString();
      read_M1(m1.edges[i][1], q1, trans, accepted);
    }
  }
  let q1 = new Set();
  let trans = {};
  let accepted = [];
  read_M1(m1, q1, trans, accepted);
  return { q1: q1, accepted: accepted, trans: trans };
}

// function to overall show the result of all subgroup extraction
export function finalRegexExtractState(regex, submatches, text) {
  const simp_graph = simplifyGraph(regex);
  console.log("min_dfa num states: ", simp_graph["states"].size);
  const tagged_simp_graph = tagged_simplifyGraph(regex, submatches);
  console.log("tagged dfa num states: ", tagged_simp_graph["states"].length);
  const matched_dfa = findSubstrings(simp_graph, text);
  console.log("matched dfa: ", matched_dfa);

  for (const subs of matched_dfa[1]) {
    let matched = text.slice(subs[0], subs[1] + 1);
    let tag_result = getTaggedResult(matched, tagged_simp_graph);
    // console.log("tag result", tag_result);
    for (let index in tag_result) {
      for (let groupInd = 0; groupInd < tag_result[index].length; groupInd++) {
        console.log(
          "Group: ",
          index,
          " #",
          groupInd,
          " is ",
          matched.slice(
            tag_result[index][groupInd][0],
            tag_result[index][groupInd][0] + tag_result[index][groupInd].length
          )
        );
      }
    }
  }
}
