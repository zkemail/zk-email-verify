import { wasm as wasm_tester } from 'circom_tester';
import path from 'path';

describe('SubstringMatch', () => {
  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(
      path.join(__dirname, './test-circuits/substring-match-test.circom'),
      {
        recompile: true,
        include: path.join(__dirname, '../../../node_modules'),
        output: path.join(__dirname, './compiled-test-circuits'),
      }
    );
  });

  const padArray = (arr: number[], length: number) => [
    ...arr,
    ...Array(length - arr.length).fill(0)
  ];

  it('should correctly match a substring', async () => {
    const input = {
      in: padArray([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], 32), // "hello world"
      startIndex: 6,
      revealedString: padArray([119, 111, 114, 108, 100], 16), // "world"
      r: 69, // A prime number for the random linear combination
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should fail when substring does not match', async () => {
    const input = {
      in: padArray([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], 32), // "hello world"
      startIndex: 6,
      revealedString: padArray([119, 111, 114, 108, 107], 16), // "worlk" (last character different)
      r: 69,
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 0,
    });
  });

  it('should handle matching at the beginning of the string', async () => {
    const input = {
      in: padArray([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], 32), // "hello world"
      startIndex: 0,
      revealedString: padArray([104, 101, 108, 108, 111], 16), // "hello"
      r: 69,
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should handle matching at the end of the string', async () => {
    const input = {
      in: padArray([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], 32), // "hello world"
      startIndex: 7,
      revealedString: padArray([111, 114, 108, 100], 16), // "orld"
      r: 69,
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should fail when startIndex is out of bounds', async () => {
    const input = {
      in: padArray([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], 32), // "hello world"
      startIndex: 32, // Out of bounds (valid indices are 0-31)
      revealedString: padArray([100], 16), // "d"
      r: 69,
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 0,
    });
  });
});