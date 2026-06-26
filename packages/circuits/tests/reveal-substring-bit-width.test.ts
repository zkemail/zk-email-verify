import fs from "fs";
import path from "path";

describe("RevealSubstring LessThan bit widths", () => {
  it("allocates one extra value for exclusive upper-bound constants", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../helpers/reveal-substring.circom"),
      "utf8",
    );
    const compactSource = source.replace(/\s+/g, "");

    expect(compactSource).toContain(
      "LessThan(log2Ceil(maxLength+1))([substringStartIndex,maxLength])",
    );
    expect(compactSource).toContain(
      "LessThan(log2Ceil(maxSubstringLength+2))([substringLength,maxSubstringLength+1])",
    );
    expect(compactSource).toContain(
      "LessThan(log2Ceil(maxLength+2))([sum,maxLength+1])",
    );
  });
});
