// This file is for creating circom circuit that can match/ reveal subgroup of regex we are interested in
// must specify the number of occurence of that subgroup we are interested in
// We assume only 1 regex matched, but they can be multiple subgroup matches with many occurence of each subgroup
//===================================================================================
import { simplifyGraph } from "./gen_dfa";
import {
  tagged_simplifyGraph,
  M1ToM2,
  M2ToM3,
  createM4,
  registerToState,
  reassignM3M4,
} from "./gen_tagged_dfa";
import { formatForCircom } from "./helper_required";

// Step generating circom for backward DFA
// Step 1:  naively gen_forw_circom by using the whole simple DFA to find that 1 regex match, store the end alphabet that leads into accepted states
// Step 2: Use m3 graph and start running on backward alphabet starting from what we marked as last alphabet in matched regex in step 1, for each backward alphabet DFA comes across,
//         we store the state that the m3 DFA is transitioned into.
// Step 3: Use m4 graph and use end point of m3 dfa as starting point, but now back to running on forward.
// but instead of feeding alphabets into m4 DFA, we use the m3 states we got from step 2 instad.
export function gen_circom(regex, submatches) {
  // ========================= step 1 region (forw region) =============================

  // gen naive DFA graph that matches the whole regex.
  const forw_graph = formatForCircom(simplifyGraph(regex));
  // lib_head, join with \n
  let final_text = "";
  const forw_lib_head = [];
  forw_lib_head.push("pragma circom 2.1.4;");
  forw_lib_head.push("");
  forw_lib_head.push('include "circomlib/circuits/comparators.circom";');
  forw_lib_head.push('include "circomlib/circuits/gates.circom";');
  forw_lib_head.push("");
  // build template MultiOR(n)
  forw_lib_head.push("template MultiOR(n) {");
  forw_lib_head.push("\tsignal input in[n];");
  forw_lib_head.push("\tsignal output out;");
  forw_lib_head.push("");
  forw_lib_head.push("\tsignal sums[n];");
  forw_lib_head.push("\tsums[0] <== in[0];");
  forw_lib_head.push("\tfor (var i = 1; i < n; i++) {");
  forw_lib_head.push("\t\tsums[i] <== sums[i-1] + in[i];");
  forw_lib_head.push("\t}");
  forw_lib_head.push("\tcomponent is_zero = IsZero();");
  forw_lib_head.push("\tis_zero.in <== sums[n-1];");
  forw_lib_head.push("\tout <== 1 - is_zero.out;");
  forw_lib_head.push("}");
  forw_lib_head.push("");

  // build tpl_head, join with \n
  const forw_tpl_head = [];
  forw_tpl_head.push("template Regex (msg_bytes, reveal_bytes, group_idx){");
  forw_tpl_head.push("\tsignal input in[msg_bytes];");
  // og tpl_head start
  forw_tpl_head.push("\tsignal input match_idx;");
  forw_tpl_head.push("\tsignal output start_idx;");
  forw_tpl_head.push("\tsignal output group_match_count;");
  forw_tpl_head.push("\tsignal output entire_count;");
  forw_tpl_head.push("");
  forw_tpl_head.push(
    "\tsignal reveal_shifted_intermediate[reveal_bytes][msg_bytes];"
  );
  forw_tpl_head.push("\tsignal output reveal_shifted[reveal_bytes];");
  forw_tpl_head.push("");

  // add forw_adj_reveal (adjusted reveal) to mark the starting points for m3 dfa
  forw_tpl_head.push("\tsignal forw_adj_reveal[msg_bytes];");
  forw_tpl_head.push("");

  // compile content placeholder, join with \n\t
  // format tags stuffs for forw part
  const forw_N = forw_graph["states"].size;
  const forw_accept_states = forw_graph["accepted_states"];

  let forw_eq_i = 0;
  let forw_lt_i = 0;
  let forw_and_i = 0;
  let forw_multi_or_i = 0;
  let forw_upper = -1;
  let forw_lower = -1;
  let forw_digit = -1;

  let forw_lines = [];
  const uppercase = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
  const lowercase = new Set("abcdefghijklmnopqrstuvwxyz".split(""));
  const digits = new Set("0123456789".split(""));
  forw_lines.push("for (var i = 0; i < msg_bytes; i++) {");
  for (let i = 1; i < forw_N; i++) {
    const forw_outputs = [];
    for (let [k, prev_i] of forw_graph["rev_transitions"][i]) {
      let forw_vals = new Set(JSON.parse(k));
      const forw_eq_outputs = [];

      if (
        new Set([...uppercase].filter((x) => forw_vals.has(x))).size ===
        uppercase.size
      ) {
        //Optimize repeated LessThan
        forw_vals = new Set([...forw_vals].filter((x) => !uppercase.has(x)));
        if (forw_upper < 0) {
          forw_lines.push("\t//UPPERCASE");
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i] = LessThan(8);`);
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i].in[0] <== 64;`);
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i].in[1] <== in[i];`);

          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i] = LessThan(8);`);
          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i].in[0] <== in[i];`);
          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i].in[1] <== 91;`);

          forw_lines.push(`\tforw_and[${forw_and_i}][i] = AND();`);
          forw_lines.push(
            `\tforw_and[${forw_and_i}][i].a <== forw_lt[${forw_lt_i}][i].out;`
          );
          forw_lines.push(
            `\tforw_and[${forw_and_i}][i].b <== forw_lt[${
              forw_lt_i + 1
            }][i].out;`
          );

          forw_eq_outputs.push(["forw_and", forw_and_i]);
          forw_upper = forw_and_i;
          forw_lt_i += 2;
          forw_and_i += 1;
        } else {
          forw_eq_outputs.push(["forw_and", forw_upper]);
        }
      }
      if (
        new Set([...lowercase].filter((x) => forw_vals.has(x))).size ===
        lowercase.size
      ) {
        // Optimize
        forw_vals = new Set([...forw_vals].filter((x) => !lowercase.has(x)));
        if (forw_lower < 0) {
          forw_lines.push("\t//lowercase");
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i] = LessThan(8);`);
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i].in[0] <== 96;`);
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i].in[1] <== in[i];`);

          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i] = LessThan(8);`);
          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i].in[0] <== in[i];`);
          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i].in[1] <== 123;`);

          forw_lines.push(`\tforw_and[${forw_and_i}][i] = AND();`);
          forw_lines.push(
            `\tforw_and[${forw_and_i}][i].a <== forw_lt[${forw_lt_i}][i].out;`
          );
          forw_lines.push(
            `\tforw_and[${forw_and_i}][i].b <== forw_lt[${
              forw_lt_i + 1
            }][i].out;`
          );

          forw_eq_outputs.push(["forw_and", forw_and_i]);
          forw_lower = forw_and_i;
          forw_lt_i += 2;
          forw_and_i += 1;
        } else {
          forw_eq_outputs.push(["forw_and", forw_lower]);
        }
      }
      if (
        new Set([...digits].filter((x) => forw_vals.has(x))).size ===
        digits.size
      ) {
        // Optimize
        forw_vals = new Set([...forw_vals].filter((x) => !digits.has(x)));
        if (forw_digit < 0) {
          forw_lines.push("\t//digits");
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i] = LessThan(8);`);
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i].in[0] <== 47;`);
          forw_lines.push(`\tforw_lt[${forw_lt_i}][i].in[1] <== in[i];`);

          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i] = LessThan(8);`);
          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i].in[0] <== in[i];`);
          forw_lines.push(`\tforw_lt[${forw_lt_i + 1}][i].in[1] <== 58;`);

          forw_lines.push(`\tforw_and[${forw_and_i}][i] = AND();`);
          forw_lines.push(
            `\tforw_and[${forw_and_i}][i].a <== forw_lt[${forw_lt_i}][i].out;`
          );
          forw_lines.push(
            `\tforw_and[${forw_and_i}][i].b <== forw_lt[${
              forw_lt_i + 1
            }][i].out;`
          );

          forw_eq_outputs.push(["forw_and", forw_and_i]);
          forw_digit = forw_and_i;
          forw_lt_i += 2;
          forw_and_i += 1;
        } else {
          forw_eq_outputs.push(["forw_and", forw_digit]);
        }
      }
      for (let c of forw_vals) {
        // to make sure just one alphabet, in backend
        // assert.strictEqual(c.length, 1);
        forw_lines.push(`\t//${c}`);
        forw_lines.push(`\tforw_eq[${forw_eq_i}][i] = IsEqual();`);
        forw_lines.push(`\tforw_eq[${forw_eq_i}][i].in[0] <== in[i];`);
        forw_lines.push(
          `\tforw_eq[${forw_eq_i}][i].in[1] <== ${c.charCodeAt(0)};`
        );
        forw_eq_outputs.push(["forw_eq", forw_eq_i]);
        forw_eq_i += 1;
      }

      forw_lines.push(`\tforw_and[${forw_and_i}][i] = AND();`);
      forw_lines.push(
        `\tforw_and[${forw_and_i}][i].a <== forw_states[i][${prev_i}];`
      );

      if (forw_eq_outputs.length === 1) {
        forw_lines.push(
          `\tforw_and[${forw_and_i}][i].b <== ${forw_eq_outputs[0][0]}[${forw_eq_outputs[0][1]}][i].out;`
        );
      } else if (forw_eq_outputs.length > 1) {
        forw_lines.push(
          `\tforw_multi_or[${forw_multi_or_i}][i] = MultiOR(${forw_eq_outputs.length});`
        );
        for (let output_i = 0; output_i < forw_eq_outputs.length; output_i++) {
          forw_lines.push(
            `\tforw_multi_or[${forw_multi_or_i}][i].in[${output_i}] <== ${forw_eq_outputs[output_i][0]}[${forw_eq_outputs[output_i][1]}][i].out;`
          );
        }
        forw_lines.push(
          `\tforw_and[${forw_and_i}][i].b <== forw_multi_or[${forw_multi_or_i}][i].out;`
        );
        forw_multi_or_i += 1;
      }
      forw_outputs.push(forw_and_i);
      forw_and_i += 1;
    }

    if (forw_outputs.length === 1) {
      forw_lines.push(
        `\tforw_states[i+1][${i}] <== forw_and[${forw_outputs[0]}][i].out;`
      );
    } else if (forw_outputs.length > 1) {
      forw_lines.push(
        `\tforw_multi_or[${forw_multi_or_i}][i] = MultiOR(${forw_outputs.length});`
      );
      for (let output_i = 0; output_i < forw_outputs.length; output_i++) {
        forw_lines.push(
          `\tforw_multi_or[${forw_multi_or_i}][i].in[${output_i}] <== forw_and[${forw_outputs[output_i]}][i].out;`
        );
      }
      forw_lines.push(
        `\tforw_states[i+1][${i}] <== forw_multi_or[${forw_multi_or_i}][i].out;`
      );
      forw_multi_or_i += 1;
    }
  }

  forw_lines.push("}");
  // deal with accepted
  forw_lines.push("component forw_check_accepted[msg_bytes+1];");

  forw_lines.push("for (var i = 0; i <= msg_bytes; i++) {");
  forw_lines.push(
    `\tforw_check_accepted[i] = MultiOR(${forw_accept_states.size});`
  );
  let forw_count_setInd = 0;
  for (let element of forw_accept_states) {
    forw_lines.push(
      `\tforw_check_accepted[i].in[${forw_count_setInd}] <== forw_states[i][${parseInt(
        element
      )}] ;`
    );
    forw_count_setInd++;
  }

  forw_lines.push("}");

  let forw_declarations = [];

  if (forw_eq_i > 0) {
    forw_declarations.push(`component forw_eq[${forw_eq_i}][msg_bytes];`);
  }
  if (forw_lt_i > 0) {
    forw_declarations.push(`component forw_lt[${forw_lt_i}][msg_bytes];`);
  }
  if (forw_and_i > 0) {
    forw_declarations.push(`component forw_and[${forw_and_i}][msg_bytes];`);
  }
  if (forw_multi_or_i > 0) {
    forw_declarations.push(
      `component forw_multi_or[${forw_multi_or_i}][msg_bytes];`
    );
  }
  forw_declarations.push(`signal forw_states[msg_bytes+1][${forw_N}];`);
  forw_declarations.push("");

  let forw_init_code = [];

  forw_init_code.push("for (var i = 0; i < msg_bytes; i++) {");
  forw_init_code.push("\tforw_states[i][0] <== 1;");
  forw_init_code.push("}");

  forw_init_code.push(`for (var i = 1; i < ${forw_N}; i++) {`);
  forw_init_code.push("\tforw_states[0][i] <== 0;");
  forw_init_code.push("}");

  forw_init_code.push("");

  const forw_reveal_code = [];

  // calculate reveal
  forw_reveal_code.push("for (var i = 0; i < msg_bytes; i++) {");
  // forw_adj_reveal is in reading backwards to be compatible with m3 reverse reading
  forw_reveal_code.push(
    "\tforw_adj_reveal[i] <== forw_check_accepted[msg_bytes - i].out;"
  );
  forw_reveal_code.push("}");
  forw_reveal_code.push("");
  forw_lines = [
    ...forw_declarations,
    ...forw_init_code,
    ...forw_lines,
    ...forw_reveal_code,
  ];

  // ========================= step 2 region (m3 region) =============================
  const tagged_simp_graph = tagged_simplifyGraph(regex, submatches);
  let m2_graph = M1ToM2(tagged_simp_graph);
  let m3_graph = M2ToM3(m2_graph);
  let m4_graph = createM4(tagged_simp_graph);
  let tagged_m4_graph = registerToState(m4_graph);
  let final_m3_m4 = reassignM3M4(m3_graph, tagged_m4_graph);
  const m3_circom_graph = formatForCircom(final_m3_m4["final_m3_graph"]);
  const m4_circom_graph = formatForCircom(final_m3_m4["final_m4_graph"]);
  let m3_tpl_head = [];
  m3_tpl_head.push("\tsignal m3_in[msg_bytes];");
  m3_tpl_head.push("\tsignal m3_adj_reveal[msg_bytes];");
  m3_tpl_head.push("\tfor (var i = 0; i < msg_bytes; i++) {");
  // backward input msgs
  m3_tpl_head.push("\t\tm3_in[i] <== in[msg_bytes - i - 1];");
  m3_tpl_head.push("\t}");

  const m3_N = m3_circom_graph["states"].size;
  const m3_accept_states = m3_circom_graph["accepted_states"];

  let m3_eq_i = 0;
  let m3_lt_i = 0;
  let m3_and_i = 0;
  let m3_multi_or_i = 0;
  let m3_upper = -1;
  let m3_lower = -1;
  let m3_digit = -1;

  let m3_lines = [];
  m3_lines.push("for (var i = 0; i < msg_bytes; i++) {");
  for (let i = 1; i < m3_N; i++) {
    const m3_outputs = [];
    for (let [k, prev_i] of m3_circom_graph["rev_transitions"][i]) {
      let m3_vals = new Set(JSON.parse(k));
      const m3_eq_outputs = [];

      if (
        new Set([...uppercase].filter((x) => m3_vals.has(x))).size ===
        uppercase.size
      ) {
        // Optimize
        m3_vals = new Set([...m3_vals].filter((x) => !uppercase.has(x)));
        if (m3_upper < 0) {
          m3_lines.push("\t//UPPERCASE");
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i] = LessThan(8);`);
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i].in[0] <== 64;`);
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i].in[1] <== m3_in[i];`);

          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i] = LessThan(8);`);
          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i].in[0] <== m3_in[i];`);
          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i].in[1] <== 91;`);

          m3_lines.push(`\tm3_and[${m3_and_i}][i] = AND();`);
          m3_lines.push(
            `\tm3_and[${m3_and_i}][i].a <== m3_lt[${m3_lt_i}][i].out;`
          );
          m3_lines.push(
            `\tm3_and[${m3_and_i}][i].b <== m3_lt[${m3_lt_i + 1}][i].out;`
          );

          m3_eq_outputs.push(["m3_and", m3_and_i]);
          m3_upper = m3_and_i;
          m3_lt_i += 2;
          m3_and_i += 1;
        } else {
          m3_eq_outputs.push(["m3_and", m3_upper]);
        }
      }
      if (
        new Set([...lowercase].filter((x) => m3_vals.has(x))).size ===
        lowercase.size
      ) {
        // Optimize
        m3_vals = new Set([...m3_vals].filter((x) => !lowercase.has(x)));
        if (m3_lower < 0) {
          m3_lines.push("\t//lowercase");
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i] = LessThan(8);`);
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i].in[0] <== 96;`);
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i].in[1] <== m3_in[i];`);

          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i] = LessThan(8);`);
          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i].in[0] <== m3_in[i];`);
          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i].in[1] <== 123;`);

          m3_lines.push(`\tm3_and[${m3_and_i}][i] = AND();`);
          m3_lines.push(
            `\tm3_and[${m3_and_i}][i].a <== m3_lt[${m3_lt_i}][i].out;`
          );
          m3_lines.push(
            `\tm3_and[${m3_and_i}][i].b <== m3_lt[${m3_lt_i + 1}][i].out;`
          );

          m3_eq_outputs.push(["m3_and", m3_and_i]);
          m3_lower = m3_and_i;
          m3_lt_i += 2;
          m3_and_i += 1;
        } else {
          m3_eq_outputs.push(["m3_and", m3_lower]);
        }
      }
      if (
        new Set([...digits].filter((x) => m3_vals.has(x))).size === digits.size
      ) {
        // Optimize
        m3_vals = new Set([...m3_vals].filter((x) => !digits.has(x)));
        if (m3_digit < 0) {
          m3_lines.push("\t//digits");
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i] = LessThan(8);`);
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i].in[0] <== 47;`);
          m3_lines.push(`\tm3_lt[${m3_lt_i}][i].in[1] <== m3_in[i];`);

          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i] = LessThan(8);`);
          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i].in[0] <== m3_in[i];`);
          m3_lines.push(`\tm3_lt[${m3_lt_i + 1}][i].in[1] <== 58;`);

          m3_lines.push(`\tm3_and[${m3_and_i}][i] = AND();`);
          m3_lines.push(
            `\tm3_and[${m3_and_i}][i].a <== m3_lt[${m3_lt_i}][i].out;`
          );
          m3_lines.push(
            `\tm3_and[${m3_and_i}][i].b <== m3_lt[${m3_lt_i + 1}][i].out;`
          );

          m3_eq_outputs.push(["m3_and", m3_and_i]);
          m3_digit = m3_and_i;
          m3_lt_i += 2;
          m3_and_i += 1;
        } else {
          m3_eq_outputs.push(["m3_and", m3_digit]);
        }
      }
      for (let c of m3_vals) {
        // to make sure just one alphabet (for backend)
        // assert.strictEqual(c.length, 1);
        m3_lines.push(`\t//${c}`);
        m3_lines.push(`\tm3_eq[${m3_eq_i}][i] = IsEqual();`);
        m3_lines.push(`\tm3_eq[${m3_eq_i}][i].in[0] <== m3_in[i];`);
        m3_lines.push(`\tm3_eq[${m3_eq_i}][i].in[1] <== ${c.charCodeAt(0)};`);
        m3_eq_outputs.push(["m3_eq", m3_eq_i]);
        m3_eq_i += 1;
      }

      m3_lines.push(`\tm3_and[${m3_and_i}][i] = AND();`);
      m3_lines.push(`\tm3_and[${m3_and_i}][i].a <== m3_states[i][${prev_i}];`);

      if (m3_eq_outputs.length === 1) {
        m3_lines.push(
          `\tm3_and[${m3_and_i}][i].b <== ${m3_eq_outputs[0][0]}[${m3_eq_outputs[0][1]}][i].out;`
        );
      } else if (m3_eq_outputs.length > 1) {
        m3_lines.push(
          `\tm3_multi_or[${m3_multi_or_i}][i] = MultiOR(${m3_eq_outputs.length});`
        );
        for (let output_i = 0; output_i < m3_eq_outputs.length; output_i++) {
          m3_lines.push(
            `\tm3_multi_or[${m3_multi_or_i}][i].in[${output_i}] <== ${m3_eq_outputs[output_i][0]}[${m3_eq_outputs[output_i][1]}][i].out;`
          );
        }
        m3_lines.push(
          `\tm3_and[${m3_and_i}][i].b <== m3_multi_or[${m3_multi_or_i}][i].out;`
        );
        m3_multi_or_i += 1;
      }
      m3_outputs.push(m3_and_i);
      m3_and_i += 1;
    }

    if (m3_outputs.length === 1) {
      m3_lines.push(
        `\tm3_states[i+1][${i}] <== m3_and[${m3_outputs[0]}][i].out;`
      );
    } else if (m3_outputs.length > 1) {
      m3_lines.push(
        `\tm3_multi_or[${m3_multi_or_i}][i] = MultiOR(${m3_outputs.length});`
      );
      for (let output_i = 0; output_i < m3_outputs.length; output_i++) {
        m3_lines.push(
          `\tm3_multi_or[${m3_multi_or_i}][i].in[${output_i}] <== m3_and[${m3_outputs[output_i]}][i].out;`
        );
      }
      m3_lines.push(
        `\tm3_states[i+1][${i}] <== m3_multi_or[${m3_multi_or_i}][i].out;`
      );
      m3_multi_or_i += 1;
    }
  }

  m3_lines.push("}");
  // deal with m3_states_num
  let m3_states_num_str = "m3_states_num[msg_bytes - i - 1] <== ";
  for (let i = 0; i < m3_N; i++) {
    if (i == m3_N - 1) {
      m3_states_num_str += ` m3_states[i][${i}]*${i};`;
    } else {
      m3_states_num_str += ` m3_states[i][${i}]*${i} +`;
    }
  }
  m3_lines.push("for (var i = 0; i < msg_bytes; i++) {");
  m3_lines.push(`\t${m3_states_num_str}`);
  m3_lines.push("}");
  m3_lines.push("");
  // Legacy: gone since we shift m3_adj_reveal and m3_states_num to the left by 1 to
  // work with m4 definition of transition
  // separate final state num since m3_states[msg_bytes][0] is undefined.
  //(make sense or it have no alphabet to transition in dfa, and we dont really want to accept epsilon)
  // let m3_final_states_num_str = `m3_states_num[0] <== `;
  // for (let i = 1; i < m3_N; i++) {
  //   if (i == m3_N - 1) {
  //     m3_final_states_num_str += ` m3_states[msg_bytes][${i}]*${i};`;
  //   } else {
  //     m3_final_states_num_str += ` m3_states[msg_bytes][${i}]*${i} +`;
  //   }
  // }
  // m3_lines.push(m3_final_states_num_str);
  // m3_lines.push("");

  // deal with accepted
  m3_lines.push("component m3_check_accepted[msg_bytes+1];");

  m3_lines.push("for (var i = 0; i <= msg_bytes; i++) {");
  m3_lines.push(`\tm3_check_accepted[i] = MultiOR(${m3_accept_states.size});`);
  let m3_count_setInd = 0;
  for (let element of m3_accept_states) {
    m3_lines.push(
      `\tm3_check_accepted[i].in[${m3_count_setInd}] <== m3_states[i][${parseInt(
        element
      )}] ;`
    );
    m3_count_setInd++;
  }

  m3_lines.push("}");

  let m3_declarations = [];

  if (m3_eq_i > 0) {
    m3_declarations.push(`component m3_eq[${m3_eq_i}][msg_bytes];`);
  }
  if (m3_lt_i > 0) {
    m3_declarations.push(`component m3_lt[${m3_lt_i}][msg_bytes];`);
  }
  if (m3_and_i > 0) {
    m3_declarations.push(`component m3_and[${m3_and_i}][msg_bytes];`);
  }
  if (m3_multi_or_i > 0) {
    m3_declarations.push(`component m3_multi_or[${m3_multi_or_i}][msg_bytes];`);
  }
  // m3_states[i+1][j] = 1 iff index i makes transition into state j. similar to others
  m3_declarations.push(`signal m3_states[msg_bytes+1][${m3_N}];`);
  // m3_states_num[i+1] tells which state alphabet i leads into (unique state since we use forw_adj_reveal)
  // already reversed from m3 for running m4
  m3_declarations.push("signal m3_states_num[msg_bytes+1];");
  m3_declarations.push("");

  let m3_init_code = [];
  // add forw_adj_reveal to not make there exist different j,k that makes both m3_states[i][j] and m3_states[i][k] = 1 for some i
  m3_init_code.push("for (var i = 0; i < msg_bytes; i++) {");
  m3_init_code.push("\tm3_states[i][0] <== forw_adj_reveal[i];");
  m3_init_code.push("}");

  m3_init_code.push(`for (var i = 1; i < ${m3_N}; i++) {`);
  m3_init_code.push("\tm3_states[0][i] <== 0;");
  m3_init_code.push("}");

  m3_init_code.push("");

  const m3_reveal_code = [];

  // new_tags region below

  // calculate reveal
  m3_reveal_code.push("for (var i = 0; i < msg_bytes; i++) {");
  // adjusted m3_adj_reveal to have starting point for m4
  m3_reveal_code.push(
    "\tm3_adj_reveal[i] <== m3_check_accepted[msg_bytes - i - 1].out;"
  );
  m3_reveal_code.push("}");
  m3_reveal_code.push("");
  m3_lines = [
    ...m3_declarations,
    ...m3_init_code,
    ...m3_lines,
    ...m3_reveal_code,
  ];

  //================================== step 3 (m4 region) ==============================
  let new_tags = {};
  for (let key in m4_circom_graph["tags"]) {
    let tran_arr = [];
    for (let ele of m4_circom_graph["tags"][key]) {
      tran_arr.push(ele);
    }
    new_tags[key] = tran_arr;
  }

  const N = m4_circom_graph["states"].size;
  const accept_states = m4_circom_graph["accepted_states"];

  let eq_i = 0;
  let lt_i = 0;
  let and_i = 0;
  let multi_or_i = 0;
  let lines = [];
  lines.push("for (var i = 0; i < msg_bytes; i++) {");

  for (let i = 1; i < N; i++) {
    const outputs = [];
    for (let [k, prev_i] of m4_circom_graph["rev_transitions"][i]) {
      let vals = new Set(JSON.parse(k));
      const eq_outputs = [];
      // since we use stored states as alphabet, so the transition only consists of numbers
      if (
        new Set([...digits].filter((x) => vals.has(x))).size === digits.size
      ) {
        vals = new Set([...vals].filter((x) => !digits.has(x)));
        lines.push("\t//digits");
        lines.push(`\tlt[${lt_i}][i] = LessThan(8);`);
        lines.push(`\tlt[${lt_i}][i].in[0] <== 47;`);
        lines.push(`\tlt[${lt_i}][i].in[1] <== m3_states_num[i];`);

        lines.push(`\tlt[${lt_i + 1}][i] = LessThan(8);`);
        lines.push(`\tlt[${lt_i + 1}][i].in[0] <== m3_states_num[i];`);
        lines.push(`\tlt[${lt_i + 1}][i].in[1] <== 58;`);

        lines.push(`\tand[${and_i}][i] = AND();`);
        lines.push(`\tand[${and_i}][i].a <== lt[${lt_i}][i].out;`);
        lines.push(`\tand[${and_i}][i].b <== lt[${lt_i + 1}][i].out;`);

        eq_outputs.push(["and", and_i]);
        lt_i += 2;
        and_i += 1;
      }
      for (let c of vals) {
        // In m4 case, c represents state in m3, hence can be larger than just one alphabet
        // NOOO assert.strictEqual(c.length, 1);
        lines.push(`\t//string compare: ${c}`);
        lines.push(`\teq[${eq_i}][i] = IsEqual();`);
        lines.push(`\teq[${eq_i}][i].in[0] <== m3_states_num[i];`);
        lines.push(`\teq[${eq_i}][i].in[1] <== ${c};`);
        eq_outputs.push(["eq", eq_i]);
        eq_i += 1;
      }

      lines.push(`\tand[${and_i}][i] = AND();`);
      lines.push(`\tand[${and_i}][i].a <== states[i][${prev_i}];`);

      if (eq_outputs.length === 1) {
        lines.push(
          `\tand[${and_i}][i].b <== ${eq_outputs[0][0]}[${eq_outputs[0][1]}][i].out;`
        );
      } else if (eq_outputs.length > 1) {
        lines.push(
          `\tmulti_or[${multi_or_i}][i] = MultiOR(${eq_outputs.length});`
        );
        for (let output_i = 0; output_i < eq_outputs.length; output_i++) {
          lines.push(
            `\tmulti_or[${multi_or_i}][i].in[${output_i}] <== ${eq_outputs[output_i][0]}[${eq_outputs[output_i][1]}][i].out;`
          );
        }
        lines.push(`\tand[${and_i}][i].b <== multi_or[${multi_or_i}][i].out;`);
        multi_or_i += 1;
      }
      outputs.push(and_i);
      and_i += 1;
    }

    if (outputs.length === 1) {
      lines.push(`\tstates[i+1][${i}] <== and[${outputs[0]}][i].out;`);
    } else if (outputs.length > 1) {
      lines.push(`\tmulti_or[${multi_or_i}][i] = MultiOR(${outputs.length});`);
      for (let output_i = 0; output_i < outputs.length; output_i++) {
        lines.push(
          `\tmulti_or[${multi_or_i}][i].in[${output_i}] <== and[${outputs[output_i]}][i].out;`
        );
      }
      lines.push(`\tstates[i+1][${i}] <== multi_or[${multi_or_i}][i].out;`);
      multi_or_i += 1;
    }
  }

  lines.push("}");
  lines.push("signal final_state_sum[msg_bytes+1];");
  // deal with accepted
  lines.push("component check_accepted[msg_bytes+1];");
  lines.push(`check_accepted[0] = MultiOR(${accept_states.size});`);
  let count_setInd = 0;
  for (let element of accept_states) {
    lines.push(
      `check_accepted[0].in[${count_setInd}] <== states[0][${parseInt(
        element
      )}];`
    );
    count_setInd++;
  }
  lines.push(`final_state_sum[0] <== check_accepted[0].out;`);
  lines.push("for (var i = 1; i <= msg_bytes; i++) {");
  lines.push(`\tcheck_accepted[i] = MultiOR(${accept_states.size});`);
  count_setInd = 0;
  for (let element of accept_states) {
    lines.push(
      `\tcheck_accepted[i].in[${count_setInd}] <== states[i][${parseInt(
        element
      )}] ;`
    );
    count_setInd++;
  }
  lines.push(
    `\tfinal_state_sum[i] <== final_state_sum[i-1] + check_accepted[i].out;`
  );
  lines.push("}");
  lines.push("entire_count <== final_state_sum[msg_bytes];");

  let declarations = [];

  if (eq_i > 0) {
    declarations.push(`component eq[${eq_i}][msg_bytes];`);
  }
  if (lt_i > 0) {
    declarations.push(`component lt[${lt_i}][msg_bytes];`);
  }
  if (and_i > 0) {
    declarations.push(`component and[${and_i}][msg_bytes];`);
  }
  if (multi_or_i > 0) {
    declarations.push(`component multi_or[${multi_or_i}][msg_bytes];`);
  }
  declarations.push(`signal states[msg_bytes+1][${N}];`);
  declarations.push("");

  let init_code = [];

  init_code.push("for (var i = 0; i < msg_bytes; i++) {");
  init_code.push("\tstates[i][0] <== m3_adj_reveal[i];");
  init_code.push("}");

  init_code.push(`for (var i = 1; i < ${N}; i++) {`);
  init_code.push("\tstates[0][i] <== 0;");
  init_code.push("}");

  init_code.push("");

  const reveal_code = [];

  reveal_code.push("signal reveal[msg_bytes];");
  for (let i = 0; i < Object.keys(new_tags).length; i++) {
    reveal_code.push(
      `component and_track${i}[msg_bytes][${new_tags[i].length}];`
    );
  }

  reveal_code.push(
    `component or_track[msg_bytes][${Object.keys(new_tags).length}];`
  );

  // calculate or_track for all tags
  reveal_code.push("for (var i = 0; i < msg_bytes; i++) {");

  for (let tagId = 0; tagId < Object.keys(new_tags).length; tagId++) {
    reveal_code.push(
      `\tor_track[i][${tagId}] = MultiOR(${new_tags[tagId].length});`
    );
    for (let tranId = 0; tranId < new_tags[tagId].length; tranId++) {
      reveal_code.push(`\tand_track${tagId}[i][${tranId}] = AND();`);
      reveal_code.push(
        `\tand_track${tagId}[i][${tranId}].a <== states[i+1][${
          JSON.parse(new_tags[tagId][tranId])[1]
        }];`
      );
      reveal_code.push(
        `\tand_track${tagId}[i][${tranId}].b <== states[i][${
          JSON.parse(new_tags[tagId][tranId])[0]
        }];`
      );

      reveal_code.push(
        `\tor_track[i][${tagId}].in[${tranId}] <== and_track${tagId}[i][${tranId}].out;`
      );
    }
  }
  reveal_code.push("}");
  reveal_code.push("");
  // calculate reveal
  reveal_code.push("for (var i = 0; i < msg_bytes; i++) {");
  reveal_code.push("\treveal[i] <== in[i] * or_track[i][group_idx].out;");
  reveal_code.push("}");
  reveal_code.push("");
  lines = [...declarations, ...init_code, ...lines, ...reveal_code];

  // tpl_end
  let tpl_end = [];
  tpl_end.push("\tvar start_index = 0;");
  tpl_end.push("var count = 0;");
  tpl_end.push("");
  tpl_end.push("component check_start[msg_bytes + 1];");
  tpl_end.push("component check_match[msg_bytes + 1];");
  tpl_end.push("component check_matched_start[msg_bytes + 1];");
  tpl_end.push("component matched_idx_eq[msg_bytes];");
  tpl_end.push("");
  tpl_end.push("for (var i = 0; i < msg_bytes; i++) {");
  tpl_end.push("\tif (i == 0) {");
  tpl_end.push("\t\tcount += or_track[0][group_idx].out;");
  tpl_end.push("\t}");
  tpl_end.push("\telse {");
  tpl_end.push("\t\tcheck_start[i] = AND();");
  tpl_end.push("\t\tcheck_start[i].a <== or_track[i][group_idx].out;");
  tpl_end.push("\t\tcheck_start[i].b <== 1 - or_track[i-1][group_idx].out;");
  tpl_end.push("\t\tcount += check_start[i].out;");
  tpl_end.push("");
  tpl_end.push("\t\tcheck_match[i] = IsEqual();");
  tpl_end.push("\t\tcheck_match[i].in[0] <== count;");
  tpl_end.push("\t\tcheck_match[i].in[1] <== match_idx + 1;");
  tpl_end.push("");
  tpl_end.push("\t\tcheck_matched_start[i] = AND();");
  tpl_end.push("\t\tcheck_matched_start[i].a <== check_match[i].out;");
  tpl_end.push("\t\tcheck_matched_start[i].b <== check_start[i].out;");
  tpl_end.push("\t\tstart_index += check_matched_start[i].out * i;");
  tpl_end.push("\t}");
  tpl_end.push("");
  tpl_end.push("\tmatched_idx_eq[i] = IsEqual();");
  tpl_end.push(
    "\tmatched_idx_eq[i].in[0] <== or_track[i][group_idx].out * count;"
  );
  tpl_end.push("\tmatched_idx_eq[i].in[1] <== match_idx + 1;");
  tpl_end.push("}");
  tpl_end.push("");
  tpl_end.push("component match_start_idx[msg_bytes];");
  tpl_end.push("for (var i = 0; i < msg_bytes; i++) {");
  tpl_end.push("\tmatch_start_idx[i] = IsEqual();");
  tpl_end.push("\tmatch_start_idx[i].in[0] <== i;");
  tpl_end.push("\tmatch_start_idx[i].in[1] <== start_index;");
  tpl_end.push("}");
  tpl_end.push("");
  tpl_end.push("signal reveal_match[msg_bytes];");
  tpl_end.push("for (var i = 0; i < msg_bytes; i++) {");
  tpl_end.push("\treveal_match[i] <== matched_idx_eq[i].out * reveal[i];");
  tpl_end.push("}");
  tpl_end.push("");
  tpl_end.push("for (var j = 0; j < reveal_bytes; j++) {");
  tpl_end.push("\treveal_shifted_intermediate[j][j] <== 0;");
  tpl_end.push("\tfor (var i = j + 1; i < msg_bytes; i++) {");
  tpl_end.push(
    "\t\treveal_shifted_intermediate[j][i] <== reveal_shifted_intermediate[j][i - 1] + match_start_idx[i-j].out * reveal_match[i];"
  );
  tpl_end.push("\t}");
  tpl_end.push(
    "\treveal_shifted[j] <== reveal_shifted_intermediate[j][msg_bytes - 1];"
  );
  tpl_end.push("}");
  tpl_end.push("");
  tpl_end.push("group_match_count <== count;");
  tpl_end.push("start_idx <== start_index;");

  // ============================= final_text aggregation ===========================
  final_text += forw_lib_head.join("\n") + "\n";
  final_text += forw_tpl_head.join("\n") + "\n" + m3_tpl_head.join("\n") + "\n";
  final_text +=
    "\n\t" +
    forw_lines.join("\n\t") +
    "\n\t" +
    m3_lines.join("\n\t") +
    "\n\t" +
    lines.join("\n\t") +
    "\n" +
    tpl_end.join("\n\t") +
    "\n}";
  final_text +=
    "\n\n//Note: in = text, match_idx = occurence of that subgroup matching we want to match, Regex(max_msg_bytes, max_reveal_bytes, group_idx)" +
    "\n\n//where max_msg_bytes = maximum byte we allow on input text, max_reveal_bytes = maximum byte we allow on revealing the submatch, group_idx = to tell which submatch we are interested in.";
  final_text +=
    "\ncomponent main { public [in, match_idx] } = Regex(100, 44,1);";
  return final_text;
}
