import fs from "fs";
import { builtinModules as builtin } from "module";

const pkg = JSON.parse(fs.readFileSync("./package.json"));

export default {
    input: "./src/r1csfile.js",
    output: {
        file: "build/main.cjs",
        format: "cjs",
    },
    external: [
        ...Object.keys(pkg.dependencies),
        ...builtin,
    ]
};
