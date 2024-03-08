// This file is for creating naive DFA, building upon lexical file to handle/compile regex properly and make DFA graph more legible
//=======================================================================================
import { regexToNfa, minDfa, nfaToDfa } from "./lexical";
import { simplifyRegex, toNature } from "./helper_required";

// compile regex into DFA graph
function compile(regex) {
  let nfa = regexToNfa(regex);
  let dfa = minDfa(nfaToDfa(nfa));

  let i,
    j,
    states = {},
    nodes = [],
    stack = [dfa],
    symbols = [],
    top;

  while (stack.length > 0) {
    top = stack.pop();
    if (!states.hasOwnProperty(top.id)) {
      states[top.id] = top;
      top.nature = toNature(top.id);
      nodes.push(top);
      for (i = 0; i < top.edges.length; i += 1) {
        if (top.edges[i][0] !== "ϵ" && symbols.indexOf(top.edges[i][0]) < 0) {
          symbols.push(top.edges[i][0]);
        }
        stack.push(top.edges[i][1]);
      }
    }
  }
  nodes.sort(function (a, b) {
    return a.nature - b.nature;
  });
  symbols.sort();

  let graph = [];
  for (let i = 0; i < nodes.length; i += 1) {
    let curr = {};
    curr.type = nodes[i].type;
    curr.edges = {};
    for (let j = 0; j < symbols.length; j += 1) {
      if (nodes[i].trans.hasOwnProperty(symbols[j])) {
        curr.edges[symbols[j]] = nodes[i].trans[symbols[j]].nature - 1;
      }
    }
    graph[nodes[i].nature - 1] = curr;
  }
  //   console.log("lexical out: ", JSON.stringify(graph));
  return graph;
}

// simplify compiled DFA graph to make it more legible
export function simplifyGraph(regex) {
  const regex_spec = simplifyRegex(regex);
  const graph_json = compile(regex_spec);
  // console.log("jern here");
  // console.log(graph_json);
  const N = graph_json.length;
  let states = new Set();
  let alphabets = new Set();
  let start_state = "0";
  let accepted_states = new Set();
  let transitions = {};
  for (let i = 0; i < N; i++) {
    states.add(i.toString());
    transitions[i.toString()] = {};
  }

  //loop through all the graph
  for (let i = 0; i < N; i++) {
    if (graph_json[i]["type"] == "accept") {
      accepted_states.add(i.toString());
    }
    if (graph_json[i]["edges"] != {}) {
      const keys = Object.keys(graph_json[i]["edges"]);
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        let arr_key = key.substring(1, key.length - 1).split(",");
        for (let k = 0; k < arr_key.length; k++) {
          let alp = arr_key[k].substring(1, arr_key[k].length - 1);
          if (!(alp in alphabets)) {
            alphabets.add(alp);
          }
          transitions[i][alp] = graph_json[i]["edges"][key].toString();
        }
      }
    }
  }

  return {
    states: states,
    alphabets: alphabets,
    start_state: start_state,
    accepted_states: accepted_states,
    transitions: transitions,
  };
}

// Define a function to check whether a string is accepted by the finite automata
function accepts(simp_graph, str) {
  let state = simp_graph["start_state"];
  for (let i = 0; i < str.length; i++) {
    const symbol = str[i];
    if (simp_graph["transitions"][state][symbol]) {
      state = simp_graph["transitions"][state][symbol];
    } else {
      return false;
    }
  }
  return simp_graph["accepted_states"].has(state);
}

export function findSubstrings(simp_graph, text) {
  const substrings = [];
  const indexes = [];
  for (let i = 0; i < text.length; i++) {
    for (let j = i; j < text.length; j++) {
      const substring = text.slice(i, j + 1);
      if (accepts(simp_graph, substring)) {
        substrings.push(substring);
        indexes.push([i, j]);
      }
    }
  }
  // indexes is inclusive at the end
  // return [substrings, indexes];
  return [substrings, indexes];
}
