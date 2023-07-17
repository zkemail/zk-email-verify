// This file is for creating DFA-tagged version
// Create by putting tag as a couple of states over the subgroup match we are interested in,
// then, minimalize it like naive DFA, we treat this DFA with tag states S, E as M1 graph,
// from then, we construct M2 to M4 as in paper.
//==================================================================================
import { parseRegex, minDfa, nfaToDfa } from "./lexical";
import { simplifyRegex, simplifyPlus, toNature } from "./helper_required";

//===================================== M1 region ===============================================
// Assume submatch already given by order of (
// check if we should put submatch start "S" tag on that index or not
function checkBeginGroup(index, submatches) {
  let result = [];
  for (let i = 0; i < submatches.length; i++) {
    for (let j = 0; j < submatches[i].length; j++) {
      if (submatches[i][j][0] == index) {
        // result.push(i);
        result.push(JSON.stringify([i, j]));
        break;
      }
    }
  }
  if (result.length != 0) {
    return result;
  }
  return false;
}
// reverse order
// check if we should put submatch end "E" tag on that index or not
function checkEndGroup(index, submatches) {
  let result = [];
  for (let i = submatches.length - 1; i >= 0; i--) {
    // new
    for (let j = 0; j < submatches[i].length; j++) {
      //
      if (submatches[i][j][1] == index) {
        // result.push(i);
        result.push(JSON.stringify([i, j]));
        break;
      }
      //
    }
    //
  }
  if (result.length != 0) {
    return result;
  }
  return false;
}

// create M1 from regex
// text is basically the naive regex
// submatches = [[begin1, end1], [begin2, end2], ...]
export function regexToM1(text, submatches) {
  "use strict";
  function generateGraph(node, start, end, count, submatches, memS, memE) {
    let i,
      last,
      temp,
      tempStart,
      tempEnd,
      beginTag,
      endTag,
      realStart,
      interEnd;
    // console.log("beginninggg");
    // console.log("Node id ", node);
    // console.log("start state b4: ", start);
    // console.log("end state b4: ", end);
    // console.log("count: ", count);
    // console.log("submatch: ", submatches);
    // console.log("memS: ", memS);
    // console.log("memE: ", memE);
    if (!start.hasOwnProperty("id")) {
      start.id = count;
      count += 1;
    }
    realStart = start;
    beginTag = checkBeginGroup(node.begin, submatches);
    // console.log("beginTag: ", beginTag);
    endTag = checkEndGroup(node.end - 1, submatches);
    // console.log("EndTag: ", endTag);

    if (beginTag) {
      temp = start;
      last = start;
      for (let i = 0; i < beginTag.length; i++) {
        // WHY memS and memE --> not repeat tag with group that overlaps in node.begin, node.end
        if (!memS.includes(beginTag[i])) {
          memS.push(beginTag[i]);
          last = { type: "", edges: [] };
          // temp.edges.push([["S", beginTag[i]], last]);
          // temp.edges.push([["S", JSON.parse(beginTag[i])[0]], last]);
          temp.edges.push(["S" + JSON.parse(beginTag[i])[0], last]);
          last.id = count;
          count += 1;
          temp = last;
        }
      }
      realStart = last;
      // console.log("real ", realStart);
    }
    // interEnd is stuffs state before end. Use as end in this stuffs. will assign id at the end.
    interEnd = end;
    if (endTag) {
      let newTag = [];

      for (let i = 0; i < endTag.length; i++) {
        // WHY memS and memE
        if (!memE.includes(endTag[i])) {
          newTag.push(endTag[i]);
        }
      }
      if (newTag.length >= 1) {
        interEnd = { type: "", edges: [] };
        temp = interEnd;
        last = interEnd;
        for (let i = 0; i < newTag.length - 1; i++) {
          memE.push(newTag[i]);
          last = { type: "", edges: [] };
          // temp.edges.push([["E", newTag[i]], last]);
          // temp.edges.push([["E", JSON.parse(newTag[i])[0]], last]);
          temp.edges.push(["E" + JSON.parse(newTag[i])[0], last]);
          temp = last;
        }
        memE.push(newTag[newTag.length - 1]);
        // last.edges.push([["E", newTag[newTag.length - 1]], end]);
        // last.edges.push([["E", JSON.parse(newTag[newTag.length - 1])[0]], end]);
        last.edges.push(["E" + JSON.parse(newTag[newTag.length - 1])[0], end]);
      } else {
        interEnd = end;
      }
    }

    switch (node.type) {
      // Ignore this case first :)
      case "empty":
        realStart.edges.push(["ϵ", interEnd]);
        break;
      case "text":
        // realStart.edges.push([[node.text], interEnd]);
        realStart.edges.push([node.text, interEnd]);
        break;
      case "cat":
        last = realStart;
        for (i = 0; i < node.parts.length - 1; i += 1) {
          temp = { type: "", edges: [] };
          let result = generateGraph(
            node.parts[i],
            last,
            temp,
            count,
            submatches,
            memS,
            memE
          );
          count = result[0];
          temp = result[1];
          last = temp;
        }
        count = generateGraph(
          node.parts[node.parts.length - 1],
          last,
          interEnd,
          count,
          submatches,
          memS,
          memE
        )[0];
        break;
      case "or":
        for (i = 0; i < node.parts.length; i += 1) {
          tempStart = { type: "", edges: [] };
          //   realStart.edges.push([["ϵ", i], tempStart]);
          realStart.edges.push(["ϵ", tempStart]);
          count = generateGraph(
            node.parts[i],
            tempStart,
            interEnd,
            count,
            submatches,
            memS,
            memE
          )[0];
        }
        break;
      //Use only greedy, maybe implement reluctant later
      case "star":
        tempStart = { type: "", edges: [] };
        tempEnd = {
          type: "",
          //   edges: [
          //     [["ϵ", 0], tempStart],
          //     [["ϵ", 1], interEnd],
          //   ],
          edges: [
            ["ϵ", tempStart],
            ["ϵ", interEnd],
          ],
        };
        // realStart.edges.push([["ϵ", 0], tempStart]);
        // realStart.edges.push([["ϵ", 1], interEnd]);
        realStart.edges.push(["ϵ", tempStart]);
        realStart.edges.push(["ϵ", interEnd]);
        count = generateGraph(
          node.sub,
          tempStart,
          tempEnd,
          count,
          submatches,
          memS,
          memE
        )[0];
        break;
    }
    let backMargin = interEnd;
    // console.log("check: ", backMargin);
    while (backMargin != end) {
      if (!backMargin.hasOwnProperty("id")) {
        backMargin.id = count;
        count += 1;
      }
      backMargin = backMargin.edges[0][1];
    }
    if (!end.hasOwnProperty("id")) {
      end.id = count;
      count += 1;
    }
    // console.log("start state after: ", start);
    // console.log("end state after: ", end);
    return [count, end];
  }

  // New: simplifyRegex and simplify Plus
  // console.log("simplify regex in Gen: ", simplifyRegex(text));
  let after_plus = simplifyPlus(simplifyRegex(text), submatches);

  // console.log("afterrr; ", after_plus["submatches"]);
  let ast = parseRegex(after_plus["regex"]),
    start = { type: "start", edges: [] },
    accept = { type: "accept", edges: [] };
  // console.log("Before plus: ", gen_dfa.simplifyRegex(text));
  // console.log("Plus works: ", after_plus["regex"]);
  // console.log("submatchh: ", submatches);
  if (typeof ast === "string") {
    return ast;
  }
  // console.log("ast: ", ast);
  // console.log("part 5: ", ast["parts"][5]);
  // console.log("part 5 OR: ", ast["parts"][5]["parts"][0]);
  // console.log("part 5 STAR: ", ast["parts"][5]["parts"][1]);
  // console.log("part 5 OR in STAR: ", ast["parts"][5]["parts"][1]["sub"]);
  // use new submatches as after_plus["submatches"] instead
  // console.log("ssss: ",after_plus["submatches"] )
  generateGraph(ast, start, accept, 0, after_plus["final_submatches"], [], []);
  return start;
}

// compile into minimal M1
export function tagged_compile(regex, submatches) {
  let nfa = regexToM1(regex, submatches);
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
// simplify M1 into better format
export function tagged_simplifyGraph(regex, submatches) {
  const graph_json = tagged_compile(regex, submatches);
  const N = graph_json.length;
  let states = [];
  let alphabets = new Set();
  let start_state = "0";
  let accepted_states = new Set();
  let transitions = {};
  for (let i = 0; i < N; i++) {
    states.push(i.toString());
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

//========================================== M2 region ========================================
// Find the states in m1 that have outgoing edge with alphabet to use as states in m2
function findQ2(m1_node, m1_graph, q2, mem = new Set()) {
  if (mem.has(m1_node)) {
    // console.log("exist already: ", m1)
    return;
  } else {
    mem.add(m1_node);
  }
  var edges = m1_graph["transitions"][m1_node];
  if (m1_graph["accepted_states"].has(m1_node)) {
    q2.push(m1_node);
    return;
  }
  for (const alp in edges) {
    if (alp.length == 1) {
      q2.push(m1_node);
      break;
    }
  }
  for (const alp in edges) {
    findQ2(edges[alp], m1_graph, q2, mem);
  }
}

// Check if pi(start, end) is defined or not
function piOnM1(m1_graph, start, end, visited = new Set()) {
  if (start == end) {
    return true;
  }
  visited.add(start);
  let edges = m1_graph["transitions"][start];
  for (const alp in edges) {
    // skip alphabet edge
    if (alp.length == 1) {
      continue;
    }
    if (visited.has(edges[alp])) {
      continue;
    }
    if (piOnM1(m1_graph, edges[alp], end, visited)) {
      return true;
    }
  }
  return false;
}

// Get all transitions for m2
function deltaQ2(m1_graph, q2) {
  let result = [];
  for (let i = 0; i < q2.length; i++) {
    for (let j = 0; j < q2.length; j++) {
      let start = q2[i];
      let end = q2[j];
      let edges = m1_graph["transitions"][start];
      for (const alp in edges) {
        if (alp.length == 1) {
          //   console.log(
          //     "from: ",
          //     edges[alp],
          //     "to ",
          //     end,
          //     " is ",
          //     piOnM1(m1_graph, edges[alp], end)
          //   );
          if (piOnM1(m1_graph, edges[alp], end)) {
            result.push([start, alp, end]);
          }
        }
      }
    }
  }
  return result;
}

// create m2 from m1
export function M1ToM2(m1_graph) {
  let q2 = [];
  let q2_start_state = new Set();
  findQ2(m1_graph["start_state"], m1_graph, q2);
  for (let i = 0; i < q2.length; i++) {
    if (piOnM1(m1_graph, m1_graph["start_state"], q2[i])) {
      q2_start_state.add(q2[i]);
    }
  }
  let transition = deltaQ2(m1_graph, q2);
  return {
    states: q2,
    start_state: q2_start_state,
    accepted_states: m1_graph["accepted_states"],
    transitions: transition,
  };
}

//====================================== M3 region =============================================
// create M3 from M2
export function M2ToM3(m2_graph) {
  let m2_q = m2_graph["states"];
  let m2_transition = m2_graph["transitions"];
  let m2_start_state = m2_graph["start_state"];
  let m2_accepted_states = m2_graph["accepted_states"];
  let q3 = [];
  let m3_q = new Set();
  let m3_transition = {};
  let m3_accepted = new Set();
  let m3_start;

  let visited = new Set();
  // set q3 to [{f}]
  q3.push(m2_accepted_states);
  let m3_tmp_start = [];
  for (const state of m2_accepted_states) {
    m3_tmp_start.push(parseInt(state));
  }
  m3_tmp_start.sort((a, b) => a - b);
  m3_tmp_start = m3_tmp_start.toString();
  m3_start = m3_tmp_start;
  // inside loop
  while (q3.length > 0) {
    let state_set = q3.pop();
    let states_arr = [];
    for (const state of state_set) {
      states_arr.push(parseInt(state));
    }
    states_arr.sort((a, b) => a - b);
    states_arr = states_arr.toString();
    if (visited.has(states_arr)) {
      continue;
    }
    let checkStart = states_arr.split(",");
    for (const state of checkStart) {
      if (m2_start_state.has(state)) {
        m3_accepted.add(states_arr);
        break;
      }
    }
    m3_q.add(states_arr);
    visited.add(states_arr);
    let alp_dict = {};
    for (const state of state_set) {
      for (let i = 0; i < m2_transition.length; i++) {
        if (m2_transition[i][2] == state) {
          if (!alp_dict.hasOwnProperty(m2_transition[i][1])) {
            alp_dict[m2_transition[i][1]] = new Set();
          }
          alp_dict[m2_transition[i][1]].add(m2_transition[i][0]);
        }
      }
    }
    for (let alp in alp_dict) {
      if (alp_dict[alp].size > 0) {
        q3.push(alp_dict[alp]);
        let alp_string = [];
        for (const state of alp_dict[alp]) {
          alp_string.push(parseInt(state));
        }
        alp_string.sort((a, b) => a - b);
        alp_string = alp_string.toString();
        if (!m3_transition.hasOwnProperty(states_arr)) {
          m3_transition[states_arr] = {};
        }
        m3_transition[states_arr][alp] = alp_string;
      }
    }
  }
  return {
    states: m3_q,
    start_state: m3_start,
    accepted_states: m3_accepted,
    transitions: m3_transition,
  };
}

//======================================== M4 region ====================================

// Find all paths without alphabet between start_id and end_id in m1
function findAllPathsBetw(m1_graph, start, end) {
  const visited = new Set();
  const paths = [];

  function dfs(node, path, tran) {
    if (node === end) {
      paths.push({ path: path, tran: tran });
      return;
    }

    visited.add(node);

    for (const key in m1_graph["transitions"][node]) {
      if (key.length > 1 && !visited.has(m1_graph["transitions"][node][key])) {
        dfs(
          m1_graph["transitions"][node][key],
          [...path, m1_graph["transitions"][node][key]],
          [...tran, key]
        );
      }
    }

    visited.delete(node);
  }

  dfs(start, [start], []);

  return paths;
}

// create m4
export function createM4(m1_graph) {
  let m2_graph = M1ToM2(m1_graph);
  let m3_graph = M2ToM3(m2_graph);
  // console.log("m3 here in gen_m4: ", m3_graph);
  // delta1 is transition in m1 that consists of only alphabet
  let delta1 = {};
  // m4_transitions = {state: {b: next, a: next}, ...}
  for (let key in m1_graph["transitions"]) {
    for (let alp in m1_graph["transitions"][key]) {
      if (alp.length == 1) {
        if (!delta1.hasOwnProperty(key)) {
          delta1[key] = {};
        }
        delta1[key][alp] = m1_graph["transitions"][key][alp];
      }
    }
  }
  // finish delta1, now search in m1 stuffs. From Q3.
  let m4_transitions = {};
  for (const subset of m3_graph["states"]) {
    let states = subset.split(",");
    for (const p in delta1) {
      let paths = [];
      let trans = [];
      for (const key in delta1[p]) {
        for (const state of states) {
          let search = findAllPathsBetw(m1_graph, delta1[p][key], state);
          //   console.log("og ", key, " from: ", delta1[p][key], " to ", state);
          //   console.log("search here: ", search);
          if (search.length > 0) {
            for (const oneSearch of search) {
              paths.push(oneSearch["path"]);
              trans.push(oneSearch["tran"]);
            }
          }
        }
      }
      // make set to get rid of duplicate
      let paths_set = new Set();
      let trans_set = new Set();
      for (const arr of paths) {
        paths_set.add(JSON.stringify(arr));
      }
      paths = [];
      for (const ele of paths_set) {
        paths.push(JSON.parse(ele));
      }
      for (const arr of trans) {
        trans_set.add(JSON.stringify(arr));
      }
      trans = [];
      for (const ele of trans_set) {
        trans.push(JSON.parse(ele));
      }

      if (paths.length > 0) {
        // Future: Deal with ambiguity matching! For now, we just defaults to first one
        // if (paths.length > 1) {
        //   throw new Error("Ambiguous subgroup matching");
        // }
        if (!m4_transitions.hasOwnProperty(p)) {
          m4_transitions[p] = {};
        }
        m4_transitions[p][subset] = [
          paths[0][paths[0].length - 1],
          // PRINT swap comments betw 2 lines below
          //   JSON.stringify(trans[0]),
          trans[0],
        ];
      }
    }
  }
  // "start" is a start node
  m4_transitions["start"] = {};
  for (const subset of m3_graph["states"]) {
    let states = subset.split(",");
    let paths = [];
    let trans = [];
    for (const state of states) {
      let search = findAllPathsBetw(m1_graph, "0", state);
      if (search.length > 0) {
        for (const oneSearch of search) {
          paths.push(oneSearch["path"]);
          trans.push(oneSearch["tran"]);
        }
      }
      if (paths.length > 0) {
        // Future: Deal with ambiguity matching! For now, we just defaults to first one
        // if (paths.length > 1) {
        //   throw new Error("Ambiguous subgroup matching in starting phase");
        // }
        // console.log("all path of ", states, " is ", trans);
        m4_transitions["start"][subset] = [
          paths[0][paths[0].length - 1],
          // PRINT swap comments betw 2 lines below
          //   JSON.stringify(trans[0]),
          trans[0],
        ];
      }
    }
  }

  // PRINT uncomment below lines
  //   console.log("M4 transitions inside: ", m4_transitions);
  return {
    states: [...m2_graph["states"], "start"],
    start_state: "start",
    accepted_states: m2_graph["accepted_states"],
    transitions: m4_transitions,
  };
}
// transform register into state transition for revealing
// + modify transition to not have associated tag.
export function registerToState(m4_graph) {
  let tranGraph = m4_graph["transitions"];
  let final_transitions = {};
  let allTags = {};
  let visited_tran = new Set();
  let num_outward = {};
  let track_outward = {};
  for (const key in tranGraph) {
    // num_outward represents possible end states that can reach from current node
    let inner_key_set = new Set();
    for (const inner_key in tranGraph[key]) {
      inner_key_set.add(tranGraph[key][inner_key][0]);
    }
    num_outward[key] = inner_key_set.size;
    track_outward[key] = 0;
  }
  let stack = [];
  stack.push({ node_id: m4_graph["start_state"], memTags: {}, boolTags: {} });
  while (stack.length > 0) {
    let { node_id, memTags, boolTags } = stack.pop();
    // if we exhaust all transitions from that node, store related tags into allTags
    if (track_outward[node_id] == num_outward[node_id]) {
      for (const key in memTags) {
        if (!allTags.hasOwnProperty(key)) {
          allTags[key] = new Set();
        }
        for (const strTran of memTags[key]) {
          allTags[key].add(strTran);
        }
      }
      continue;
    }
    // if there's transition from that node, we haven't explored yet
    // Note that we consider visitted transition only from (from, to) without taking care of
    // alphabet that leads that transition cuz we dont selectively reveal just a certain alphabet.
    for (const key in tranGraph[node_id]) {
      if (
        visited_tran.has(JSON.stringify([node_id, tranGraph[node_id][key][0]]))
      ) {
        continue;
      }
      // if not add this visit into visited_tran
      visited_tran.add(JSON.stringify([node_id, tranGraph[node_id][key][0]]));
      track_outward[node_id] += 1;
      let cl_memTags = {};
      for (const tmp_key in memTags) {
        cl_memTags[tmp_key] = new Set(memTags[tmp_key]);
      }
      let cl_boolTags = Object.assign({}, boolTags);
      // store relevant transitions to its corresponding tags
      for (const boolTag in cl_boolTags) {
        if (cl_boolTags[boolTag]) {
          if (!cl_memTags.hasOwnProperty(boolTag)) {
            cl_memTags[boolTag] = new Set();
          }
          cl_memTags[boolTag].add(
            JSON.stringify([node_id, tranGraph[node_id][key][0]])
          );
        }
      }
      // modify boolean states
      let tag_arr = tranGraph[node_id][key][1];
      if (tag_arr.length > 0) {
        for (const subtag of tag_arr) {
          if (subtag[0] == "E") {
            cl_boolTags[subtag[1]] = false;
          } else {
            cl_boolTags[subtag[1]] = true;
          }
        }
      }
      stack.push({
        node_id: tranGraph[node_id][key][0],
        memTags: cl_memTags,
        boolTags: cl_boolTags,
      });
    }
  }

  for (const firstkey in tranGraph) {
    final_transitions[firstkey] = {};
    for (const secondkey in tranGraph[firstkey]) {
      final_transitions[firstkey][secondkey] =
        tranGraph[firstkey][secondkey][0];
    }
  }
  return {
    states: m4_graph["states"],
    start_state: m4_graph["start_state"],
    accepted_states: m4_graph["accepted_states"],
    transitions: final_transitions,
    tags: allTags,
  };
}

// function for reassigning state name of m3 and m4 into just consecutive numbers
// m4_graph is after getting allTags
export function reassignM3M4(m3_graph, m4_graph) {
  // reassign state number in m3
  let new_m3_states = new Set();
  new_m3_states.add("0");
  let m3_state_dict = {};
  m3_state_dict[m3_graph["start_state"]] = "0";
  let i = 1;
  for (const prev_m3_state of m3_graph["states"]) {
    if (prev_m3_state != m3_graph["start_state"]) {
      new_m3_states.add(i.toString());
      m3_state_dict[prev_m3_state] = i.toString();
      i++;
    }
  }
  let new_m3_transitions = {};
  for (const key in m3_graph["transitions"]) {
    new_m3_transitions[m3_state_dict[key]] = {};
    for (const alp in m3_graph["transitions"][key]) {
      new_m3_transitions[m3_state_dict[key]][alp] =
        m3_state_dict[m3_graph["transitions"][key][alp]];
    }
  }
  let new_m3_accepted_states = new Set();
  for (const ele of m3_graph["accepted_states"]) {
    new_m3_accepted_states.add(m3_state_dict[ele]);
  }
  let new_m3_graph = {
    states: new_m3_states,
    start_state: m3_state_dict[m3_graph["start_state"]],
    accepted_states: new_m3_accepted_states,
    transitions: new_m3_transitions,
  };
  // hence reassign transition alphabet in m4
  let new_m4_transitions = {};
  for (const key in m4_graph["transitions"]) {
    new_m4_transitions[key] = {};
    for (const alp in m4_graph["transitions"][key]) {
      new_m4_transitions[key][m3_state_dict[alp]] =
        m4_graph["transitions"][key][alp];
    }
  }
  let new_m4_states = new Set();
  new_m4_states.add("0");
  let m4_state_dict = {};
  m4_state_dict[m4_graph["start_state"]] = "0";
  i = 1;
  for (const prev_m4_state of m4_graph["states"]) {
    if (prev_m4_state != m4_graph["start_state"]) {
      new_m4_states.add(i.toString());
      m4_state_dict[prev_m4_state] = i.toString();
      i++;
    }
  }
  let final_m4_transitions = {};
  for (const key in new_m4_transitions) {
    final_m4_transitions[m4_state_dict[key]] = {};
    for (const alp in new_m4_transitions[key]) {
      final_m4_transitions[m4_state_dict[key]][alp] =
        m4_state_dict[new_m4_transitions[key][alp]];
    }
  }
  let new_m4_accepted_states = new Set();
  for (const ele of m4_graph["accepted_states"]) {
    new_m4_accepted_states.add(m4_state_dict[ele]);
  }
  let new_allTags = {};
  for (const key in m4_graph["tags"]) {
    new_allTags[key] = new Set();
    for (const arrStr of m4_graph["tags"][key]) {
      let arr = JSON.parse(arrStr);
      new_allTags[key].add(
        JSON.stringify([m4_state_dict[arr[0]], m4_state_dict[arr[1]]])
      );
    }
  }
  let new_m4_graph = {
    states: new_m4_states,
    start_state: m4_state_dict[m4_graph["start_state"]],
    accepted_states: new_m4_accepted_states,
    transitions: final_m4_transitions,
    tags: new_allTags,
  };

  //   console.log("final finall m4: ", new_m4_graph);
  return { final_m3_graph: new_m3_graph, final_m4_graph: new_m4_graph };
}

// ================================== For frontend ================================

// // return all indexes that is included in a certain subgroup match.
// text is already matched by plain DFA!
export function getTaggedResult(text, tagged_simp_graph) {
  let m2_graph = M1ToM2(tagged_simp_graph);
  let m3_graph = M2ToM3(m2_graph);
  let m4_graph = createM4(tagged_simp_graph);
  let tagged_m4_graph = registerToState(m4_graph);
  let final_m3_m4 = reassignM3M4(m3_graph, tagged_m4_graph);
  // console.log("final m3: ", final_m3_m4["final_m3_graph"]);
  // console.log("final m4: ", final_m3_m4["final_m4_graph"]);

  // run reversed text via m3
  let m3_states = [];
  let m3_node = final_m3_m4["final_m3_graph"]["start_state"];
  m3_states.push(m3_node);
  for (let index = text.length - 1; index >= 0; index--) {
    m3_node =
      final_m3_m4["final_m3_graph"]["transitions"][m3_node][text[index]];
    m3_states.push(m3_node);
  }
  m3_states.reverse();
  // run m4
  let allTags = final_m3_m4["final_m4_graph"]["tags"];
  let submatch = {};
  let latest_ele = {};
  let latest_arr = {};
  for (const tag in allTags) {
    submatch[tag] = [];
    latest_ele[tag] = -2;
    latest_arr[tag] = -1;
  }
  let m4_node = final_m3_m4["final_m4_graph"]["start_state"];
  m4_node = final_m3_m4["final_m4_graph"]["transitions"][m4_node][m3_states[0]];
  for (let i = 0; i < text.length; i++) {
    for (const tag in allTags) {
      if (
        allTags[tag].has(
          JSON.stringify([
            m4_node,
            final_m3_m4["final_m4_graph"]["transitions"][m4_node][
              m3_states[i + 1]
            ],
          ])
        )
      ) {
        if (i == latest_ele[tag] + 1) {
          submatch[tag][latest_arr[tag]].push(i);
        } else {
          submatch[tag].push([i]);
          latest_arr[tag] += 1;
        }
        latest_ele[tag] = i;
      }
    }
    m4_node =
      final_m3_m4["final_m4_graph"]["transitions"][m4_node][m3_states[i + 1]];
  }

  return submatch;
}
