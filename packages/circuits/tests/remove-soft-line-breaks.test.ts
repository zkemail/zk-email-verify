import { wasm as wasm_tester } from 'circom_tester';
import path from 'path';

describe('RemoveSoftLineBreaks', () => {
  jest.setTimeout(20_1000);

  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(
      path.join(
        __dirname,
        './test-circuits/remove-soft-line-breaks-test.circom'
      ),
      {
        recompile: true,
        include: path.join(__dirname, '../../../node_modules'),
        output: path.join(__dirname, './compiled-test-circuits'),
      }
    );
  });

  it('should correctly remove soft line breaks', async () => {
    const input = {
      encoded: [
        115,
        101,
        115,
        58,
        61,
        13,
        10,
        45,
        32,
        83,
        114,
        101,
        97,
        107,
        61,
        13,
        10,
        ...Array(15).fill(0),
      ],
      decoded: [
        115,
        101,
        115,
        58,
        45,
        32,
        83,
        114,
        101,
        97,
        107,
        ...Array(21).fill(0),
      ],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should fail when decoded input is incorrect', async () => {
    const input = {
      encoded: [
        115,
        101,
        115,
        58,
        61,
        13,
        10,
        45,
        32,
        83,
        114,
        101,
        97,
        107,
        61,
        13,
        10,
        ...Array(15).fill(0),
      ],
      decoded: [
        115,
        101,
        115,
        58,
        45,
        32,
        83,
        114,
        101,
        97,
        108, // Changed last character
        ...Array(21).fill(0),
      ],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 0,
    });
  });

  it('should handle input with no soft line breaks', async () => {
    const input = {
      encoded: [104, 101, 108, 108, 111, ...Array(27).fill(0)],
      decoded: [104, 101, 108, 108, 111, ...Array(27).fill(0)],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should handle input with multiple consecutive soft line breaks', async () => {
    const input = {
      encoded: [
        104,
        101,
        108,
        108,
        111,
        61,
        13,
        10,
        61,
        13,
        10,
        119,
        111,
        114,
        108,
        100,
        ...Array(16).fill(0),
      ],
      decoded: [
        104,
        101,
        108,
        108,
        111,
        119,
        111,
        114,
        108,
        100,
        ...Array(22).fill(0),
      ],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should handle input with soft line break at the beginning', async () => {
    const input = {
      encoded: [61, 13, 10, 104, 101, 108, 108, 111, ...Array(24).fill(0)],
      decoded: [104, 101, 108, 108, 111, ...Array(27).fill(0)],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should handle input with soft line break at the end', async () => {
    const input = {
      encoded: [104, 101, 108, 108, 111, 61, 13, 10, ...Array(24).fill(0)],
      decoded: [104, 101, 108, 108, 111, ...Array(27).fill(0)],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });

  it('should handle input with incomplete soft line break sequence', async () => {
    const input = {
      encoded: [
        104,
        101,
        108,
        108,
        111,
        61,
        13,
        11, // Not a soft line break (LF should be 10)
        ...Array(24).fill(0),
      ],
      decoded: [104, 101, 108, 108, 111, 61, 13, 11, ...Array(24).fill(0)],
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);

    await circuit.assertOut(witness, {
      isValid: 1,
    });
  });
});
