# ZK Regex

This code generates a circom regex file with Python and JS, but doesn't support all regex syntax. You have to edit the test_regex function in regex_to_dfa.js to change what is generated.

Note that there is a buggy JS version of this code with tests and a command line tool at https://github.com/zk-email-verify/zk-regex/, which also now supports some additional character classes. Once it reaches parity, we expect to update this repo to use that library instead of gen.py.

Edit the regex on the top of lexical.js to change which regex is generated, then run `python3 gen.py`.

## Circom Instructions

First, generate a regex. Go to our [min_dfa fork](zkregex.com/min_dfa) of cyberzhg's toolbox and insert your regex on the top line. We've forked [min-dfa into a UI here](zkregex.com/min_dfa) to create a UI that converts existing regexes with [] support, as well as escapes \_, and the character classes a-z, A-Z, and 0-9. It also shows the DFA states very clearly so you can choose accept states easily. This should make converting regexes into DFA form way cleaner.

In the function `test_regex()` in `regex_to_dfa.js`, modify either `let raw_regex = ` (that supports some regex strings like `[A-Za-z0-9]` [but no other character ranges]) or modify `let regex = regexToMinDFASpec(<raw regex>)` (that does not support generic brackets or character ranges, only the limited syntax in https://zkregex.com/min_dfa) in `regex_to_circom/regex_to_dfa.js`. The top line of min_dfa tool corresponds to the "raw_regex", and the second line corresponds to the expanded "regex".

Then run `npx tsx regex_to_dfa.js` to make sure that it compiles and `tsx` is installed, and then remove all `console.log` statements except for the last line, and finally run `python3 gen.py`.

This will output a circom body. Wrap it the same way for instance circuits/regexes/from_regex.circom is written. Note that states in the zkregex [min_dfa visualizer](zkregex.com/min_dfa) are now 0 indexed (previous to Apr 2023 you had to subtract 1 from the indexes that showed up to match the circom, now it is the same).

Note that if your regex uses `^` at the start to mean sentinel starting character, you have to edit the resulting regex.circom file to manually change `94` (ascii code of ^) to `128` (manually inserted sentinel character meaning start, you'll see it defined as the 0th character of the string).

We will soon have a website [WIP](https://frontend-zk-regex.vercel.app/) that automatically does this. If you'd like to make this process simpler, cleaner, and less hacky, we'd recommend making a PR here or to the zk-regex library (which is a bit out of date regex-string wise and match group-wise).

## Notes

states[i+1][j] means that there was a character at msg[i] which led to the transition to state j.

This means that reveal for index i should be looking at state of index i+1.

Note that ^ has to be manually replaced with \x80 in the circom regex.

## Halo2

You can use the compiled halo2_regex_lookup.txt file as input to the https://github.com/zk-email-verify/halo2-regex/ library, which will generate a regex circuit in halo2 instead. That circuit is more efficient than this one for large inputs for use for fast clientside proofs that require privacy.

## Some regexes

There are more in the regex section of the top level zk-email-verify README. Here are some examples however, for instance for from/subject/to order-free extraction:

raw regex: ((\\n|\x80|^)(((from):([A-Za-z0-9 _."@-]+<)?[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.]+>)?|(subject:[a-zA-Z 0-9]+)?|((to):([A-Za-z0-9 _."@-]+<)?[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.]+>)?)(\\r))+
min-dfa version: (((\n|^)(((from):([A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|0|1|2|3|4|5|6|7|8|9| |_|.|"|@|-]+<)?[a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_|.|-]+@[a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_|.]+>)?|(subject:[a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z| |0|1|2|3|4|5|6|7|8|9]+)?|((to):([A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|0|1|2|3|4|5|6|7|8|9| |_|.|"|@|-]+<)?[a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_|.|-]+@[a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_|.]+>)?)(\r))+)
