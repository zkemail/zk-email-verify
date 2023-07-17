# full_zk_regex

Presentation [just 10 Min!]: https://drive.google.com/file/d/1MFT7BZmB7wgMqhr_AgT_60dukdG_0v9P/view

Slide: https://docs.google.com/presentation/d/1nSZdmwDKXjEM6bP6WBYyAWbCgK4cjpm-SXqDAA-MOjE/edit?usp=sharing

## Summary

We allow developers to instantly create circom circuit that can both match regex and reveal the submatch they are interested in, without needing to manually mark the states from regex state machine.(See more issues our approach has solved in presentation or slide above!) After a few steps on frontend as shown in presentation, developers can use their newly baked circom circuit by

component main { public [in, match_idx] } = Regex(max_msg_byte, max_reveal_byte, group_idx);

where "in" is the whole text, "match_idx" is to tell which occurance of a certain submatch we are interested in, "max_msg_byte" = maximum byte we allow on input text, "max_reveal_bytes" = maximum byte we allow on revealing the submatch, and "group_idx" = to tell which submatch we are interested in.";

## How to Use

1. Fill the text field with the original text format you want to extract subgroup from (have multiple lines and tabs are ok, so just copy your interested text.)

2. Fill the regex field with the regex you want to match but with explicit syntax like \n to represent new line instead of using original format like the text field. (same for \r, \t, \v,\f)

Escape chars are escaped with \ e.g. \”, \*, \+, ...

3. When defining regex with \* and + for subgroup match, write () over that subgroup we are interested in e.g. ((a|b|c)+)

4. Click Match RegEx! to see where in the text that are matched by our regex

5. Highlight "Regex to be Highlighted" by clicking "Begin Regex Highlight", then choose two points as subgroup inclusive boundary we want to match, then click "End Regex Highlight" to name the subgroup we are extracting.

6. Repeat Step 5, If done, just "Download Circom" and DONE!

7. We also have msg generator at the bottom, in case you want to generate msg for testing with zkrepl.dev

## How it works (overview)

Input: regex, submatches, text  
Output: Return circom that allows us to reveal a specific submatch we defined through frontend.

Data flow and related functions [All for frontend, except the last one for generating circom]

1. Users type regex format like regex = "DKI: (([a-z]=([12/]+); )+)bh"
2. Frontend processes this regex, by simp_regex = helper_required.simplifyRegex
   (to deal with escape and change [] into "or" statements), then let users highlight start and end of each group (inclusive) of this simp_regex. Save the value as submatches e.g.
   const submatches = [
   [5, 75],
   [7, 59],
   [61, 70],
   ];
3. Match all the strings that satisfies regex as a whole. ฺ
   Run
   const simp_graph = gen_dfa.simplifyGraph(regex);

   const matched_dfa = gen_dfa.findSubstrings(simp_graph, text);

   for (const subs of matched_dfa[1]) {

   var matched = text.slice(subs[0], subs[1] + 1);} Very important of +1!!

4. Now for each matched, we start extracting corresponding indexes for each submatch (we can have multiple matched values! aka many match_idx)

   const tagged_simp_graph = gen_tagged_dfa.tagged_simplifyGraph(regex, submatches);

   var tag_result = gen_tagged_dfa.getTaggedResult(text, tagged_simp_graph);

   Note: the rest can be seen in MainPage.js

5. To create Circom, we run
   let circom = gen_circom.gen_circom(regex, submatches);

Note that we can see more tests of calling function in test.js file

## How it works (Details)

How to creat circom for extracting submatch in regex.

Part 1: we create Tagged DFA. Given Regex, we want to be able to specify a certain submatch in that regex so that we can not only match the whole regex, but also be able to extract that specific submatch from the text as well.

Parameter:

- Regex: Define the whole regex we want to match together with a certain submatch we want to extract from that regex. For this tool, please put parentheses over the submatch you want to extract, again there can be multiple submatches! for example instead of writing regex as "I am [a-z]+, and [0-9]+ yrs old", put it as "I am ([a-z]+), and ([0-9]+) yrs old" in case we want to extract name and age of that person.

  [We can see that with this, we make sure people have well-defined submatch definition, and must not extract submatch of "b)c" from regex "d(a|b)c". Instead they can redefine regex as "d((a|b)c)" and now can extract submatch "((a|b)c)"]

- Submatch: Assume it is already processed by simplifyRegex and simplifyPlus. In case of multiple submatches, we order it in ascending order of the leftmost parentheses of that submatch.

Steps

1. Given regex and submatch, we construct NFA like we usually do, but now for each i-th submatch we create another state in front of the first state included in that submatch and have a transition "Si" leads into that state, while create another state after the last state included in that submatch and have a transition "Ei" connecting between that last state into this state. For other states, just connect to these special Si, Ei states as if they would with the state that Si precedes, or Ei follows.
2. We, then, transform this NFA into its minimized DFA which is unique by theory. However, it is noted that we cannot use this DFA to run DFA that can match tagged because we still have Si, Ei state in this DFA. Although, we take out these Si, Ei states, because during our NFA-to-DFA transformation we always keep in mind of Si, Ei states, when we remove it, the machine may not be DFA anymore i.e. the machine can result in having multiple similar alphabets that transitions out from the same edge like NFA.
3. To take care of this tagged problem, we uses the method explained in https://www.labs.hpe.com/techreports/2012/HPL-2012-41R1.pdf Basically, we just ignore the notion of +/- and epsilon because we start M1 as the DFA that have Si, Ei transition attached to it. (Note that we do not start the process in paper from scratched NFA because doing so will result in exponential number of states, so we make sure to minimize the state machine into DFA first to be able to have linear complexity in DFA states, which is very critical for circom circuit constraint)

We run this following methods. [All methods are in gen_tagged_dfa.js]

const tagged_simp_graph = tagged_simplifyGraph(regex, submatches);

let m2_graph = M1ToM2(tagged_simp_graph);

let m3_graph = M2ToM3(m2_graph);

let m4_graph = createM4(tagged_simp_graph);

Brief explanation for algo:

tagged_simp_graph is the tagged minimized DFA with Si, Ei attached (we use as m1 in paper).

m2 graph is similar to m1 but have only states that have outgoing transition.

m3 graph is the reverted version of m2 to run on backward text. For each alphabet of revert text that run upon m3 machine, we record the states of m3 machien that the alphabet leads the transition into. We will use these states as the input in m4 machine.

m4 graph is similar to m2 but the transition alphabet is m3 state instead, and for each transition it has register that store the start and end index of string that falls under that certain submatch.

4. After gettting m4 as in paper, we transform the graph that extract submatch by register into specifying which state transition is included in each tag (this process also allows us to detect multiple occurences of strings in the same submatch naturally). Then, we reassign the state number of m3 and m4 to become just plain consecutive numbers.

   let tagged_m4_graph = registerToState(m4_graph);

   let final_m3_m4 = reassignM3M4(m3_graph, tagged_m4_graph);

   console.log("final m3: ", final_m3_m4["final_m3_graph"]);

   console.log("final m4: ", final_m3_m4["final_m4_graph"]);

Part 2: Create Circom. we run dfa 3 times. [high level is as follows]

Steps

1. Run naive minimized DFA without tag version to find the end alphabet of string that matches our regex.
2. With that end alphabet, we run string backward from that alphabet on m3 graph, store the state of m3 that each alphabet into.
3. Use each state we got in m3 as alphabet for transition in m4 graph. [and start running only from the last alphabet that ends in m3 graph (since m3 graph is reversed, the last of it is the first alphabet of the string that matches our regex)]

Note: M3 and M4 are needed in constructing circom because we need both forward and backward running state machines, or else we cannot distinguish extracting (a|b) from between regex (a|b)c and (a|b)d.

However, in this project, we needs the naive minimized DFA without tag to get the first alphabet for m3 to be able to calculate state of m3 graph that each alphabet leads to in circom.
[Likely to be optimized and can remove running this naive non-tagged DFA]

## Limitations

- This project assumes that our regex is well-defined that there is only ONE string that match our regex. (But there can be multiple submatches, and multiple substrings for each submatches in that ONE regex match)
- This project doesn't allow users to decide the algorithm for ambiguous submatch. For example, the text a = b = c, but with submatch [submatch1]=[submatch2], it can be either (a)=(b=c) or (a=b)=c, resulting in ambiguity. In this project, we just choose the first one that we found, but in reality there are tons of ways to define how to break ambiguity. (In paper, they handle ambiguity in submatch by using +/-)

## Future Work

Algorithm:

- We are already at linear with msg_byte\*state number (same complexity as naive zk regex), and we know that we need to run at least 2 rounds of state machine, one to run reversed version and store state change, while the other is to use that stored state to run through the forward state machine. However, currently to help write circom, we run the other round of naive DFA forward first to find the last alphabet to help keep state change of reversed DFA. We should try to cut this round out to reduce to just 2 rounds of state machine run.
- Generalize to be able to match more than 1 regex & reveal multiple submatches at the same time. Because currently, we assume that regex is so well-defined that it just matches one regex in the whole text. Although we allow multiple subgroups, we need to specify match_idx to choose which occurence of that subgroup to be revealed, we are thinking about able to reveal multiple match_idx or even multiple subgroup all at same time.

UX/UI

- Currently, to specify submatch, users must select two positions as the inclusive boundary for that submatch, we should make it possible for people to be able to just highlight submatch they want.

- Be more descriptive at error handling, potentially once users highlight submatch regex, it can immediately flag out why that submatch highlight or even regex is in wrong format (like missing parentheses) or not supported.

## Update

We already optimize the repeated computation caused by multiple exact same LessThan gate.

## Optional

- Show final regex matching and what submatches become after expanding +, by running: after_plus = helper_miscel.simplifyPlus(simp_regex, submatches).
  var final_regex = after_plus["regex_show"];
  var final_submatches = after_plus["final_submatches"]; i.e.[
  [ [ 5, 65 ] ],
  [ [ 7, 13 ], [ 36, 42 ] ],
  [ [ 15, 31 ], [ 44, 60 ] ]
  ]
  (inclusive)

## Thank You:

This work cannot be completed without these people:

- Aayush & Sampriti for zk regex first version since zk email
- Anka for frontend code that this demo is built upon.
- [Katat](https://github.com/zkemail/zk-regex/tree/main) for first version of submatch extraction
- [Paper](https://www.labs.hpe.com/techreports/2012/HPL-2012-41R1.pdf) for submatch algorithm that we used as foundation.
- Sora for ideas in zk-regex halo2
- 0xPARC for making the student research program and vietnam residency (with PSE) possible.
