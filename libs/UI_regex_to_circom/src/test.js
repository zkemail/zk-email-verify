// This file is for testing outputs of these js files in src folder
// Just console.log (what you want) in this file, and run "yarn testfunc"
//===================================================================================

import { gen_circom } from "./gen_circom";
import {
  tagged_simplifyGraph,
  M1ToM2,
  M2ToM3,
  createM4,
  registerToState,
  reassignM3M4,
} from "./gen_tagged_dfa";
import { readSubmatch, finalRegexExtractState } from "./helper_miscel";
import { simplifyRegex } from "./helper_required";
function test() {
  //============================== text ==============================================
  const text =
    "adsfasd DKI d=2211; DKI: v=12/; d=22; a=//121; d=1; bh=xUqTs2T2FPGCOB52 sdflj";

  //============================== regex ==============================================
  // 1st regex
  // const regex = "DKI: (([vad]=([12/]+); )+)bh";
  // 2nd regex
  // const regex = "DKI: (([bvad]=([12/]+); )+)bh";
  // 3rd regex
  const regex = "DKI: (([a-z]=([12/]+); )+)bh";

  //============================== submatch ==============================================

  // Submatch can have multiple values, depending on number of group you are interested in,
  // They must be in ascending order by the leftmost bracket of that group

  // 1st regex submatch [vad]
  // const submatches = [
  //   [5, 29],
  //   [7, 13],
  //   [15, 24],
  // ];

  // 2nd regex: [bvad] repeats b with bh
  // const submatches = [
  //   [5, 31],
  //   [7, 15],
  //   [17, 26],
  // ];

  // 3rd regex: [a-z]
  const submatches = [
    [5, 75],
    [7, 59],
    [61, 70],
  ];
  //============================== Test console.log ==============================================
  // for slide
  // const regex = "(((a|b)c)+)b";
  // const submatches = [
  //   [0, 10],
  //   [2, 6],
  // ];
  // unroll those special [] stuffs
  // console.log("simp_regex: ", simplifyRegex(regex));

  // See if the submatches array we define is actually what we want
  // readSubmatch(regex, submatches);

  // // Show that the resutl of submatch extraction is correct
  // finalRegexExtractState(regex, submatches, text);

  // // Test our tagged graph construction from m1 - m4 stuffs, especially m3, m4
  // const tagged_simp_graph = tagged_simplifyGraph(regex, submatches);
  // // console.log("m1: ", tagged_simp_graph);
  // let m2_graph = M1ToM2(tagged_simp_graph);
  // // console.log("m2 jya: ", m2_graph);
  // let m3_graph = M2ToM3(m2_graph);
  // // console.log("m3 jya: ", m3_graph);
  // let m4_graph = createM4(tagged_simp_graph);
  // let tagged_m4_graph = registerToState(m4_graph);
  // // console.log("tagged m4: ", tagged_m4_graph);
  // let final_m3_m4 = reassignM3M4(m3_graph, tagged_m4_graph);
  // console.log("final m3: ", final_m3_m4["final_m3_graph"]);
  // console.log("final m4: ", final_m3_m4["final_m4_graph"]);

  // // Test generate circom circuit
  // console.log("circom here: ");
  let circom = gen_circom(regex, submatches);
  console.log(circom);

  console.log("Done Testing!");
}
describe("test backend", function () {
  it("should print correctly", function () {
    test();
  });
});
