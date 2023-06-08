# ZK Regex

This code generates a circom regex file with Python and JS, but doesn't support all regex syntax.

Note that there is a full JS version of this code with tests at https://github.com/zk-email-verify/zk-regex/ , which also now supports some additional character classes. Once it reaches parity, we expect to update this repo to use that library instead.

Edit the regex on the top of lexical.js to change which regex is generated, then run `python3 gen.py`.

## Halo2

You can use the compiled halo2_regex_lookup.txt file as input to the https://github.com/zk-email-verify/halo2-regex/ library, which will generate a regex circuit in halo2 instead. That circuit is much more efficient than this one for large inputs.

## Notes

states[i+1][j] means that there was a character at msg[i] which led to the transition to state j.

This means that reveal for index i should be looking at state of index i+1.
