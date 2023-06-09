# R1CS Binary File Format

This is a helper library to read r1cs binary files defined [here](doc/r1cs_bin_format.md)

## Usage

```
const loadR1cs = require("r1csfile").load

loadR1cs("myfile.r1cs").then((r1cs) => {
	console.log(r1cs);
});




