import { wasm } from "circom_tester";
import { Scalar } from "ffjavascript";
import path from "path";


exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("Base64 Lookup", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm(
      path.join(__dirname, "./test-circuits/base64-test.circom"),
      {
        recompile: true,
        include: path.join(__dirname, "../../../node_modules"),
        // output: path.join(__dirname, "./compiled-test-circuits"),
      }
    );
  });

  it("should decode valid base64 chars", async function () {
    const inputs = [
      [65, 0], // A
      [90, 25], // Z
      [97, 26], // a
      [122, 51], // z
      [48, 52], // 0
      [57, 61], // 9
      [43, 62], // +
      [47, 63], // /
      [61, 0], // =
    ]

    for (const [input, output] of inputs) {
      const witness = await circuit.calculateWitness({
        in: input
      });
      await circuit.checkConstraints(witness);
      await circuit.assertOut(witness, { out: output })
    }
  });

  it("should fail with invalid chars", async function () {
    const inputs = [34, 64, 91, 44];

    expect.assertions(inputs.length);
    for (const input of inputs) {
    try {
      const witness = await circuit.calculateWitness({
        in: input
      });
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
    }
  });
});
