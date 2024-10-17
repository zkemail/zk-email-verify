import fs from 'fs';
import path from 'path';
import { generateEmailVerifierInputs } from '../src/input-generators';
import { bytesToString } from '../src/binary-format';

jest.setTimeout(10000);

describe('Input generators', () => {
  it('should generate input from raw email', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

    const inputs = await generateEmailVerifierInputs(email);

    expect(inputs.emailHeader).toBeDefined();
    expect(inputs.pubkey).toBeDefined();
    expect(inputs.signature).toBeDefined();
    expect(inputs.precomputedSHA).toBeDefined();
    expect(inputs.emailBody).toBeDefined();
    expect(inputs.emailBodyLength).toBeDefined();
    expect(inputs.bodyHashIndex).toBeDefined();
  });

  it('should generate input without body params when ignoreBodyHash is true', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

    const inputs = await generateEmailVerifierInputs(email, {
      ignoreBodyHashCheck: true,
    });

    expect(inputs.emailHeader).toBeDefined();
    expect(inputs.pubkey).toBeDefined();
    expect(inputs.signature).toBeDefined();
    expect(inputs.precomputedSHA).toBeFalsy();
    expect(inputs.emailBody).toBeFalsy();
    expect(inputs.emailBodyLength).toBeFalsy();
    expect(inputs.bodyHashIndex).toBeFalsy();
  });

  it('should generate input with SHA precompute selector', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good-large.eml'));

    const inputs = await generateEmailVerifierInputs(email, {
      shaPrecomputeSelector: 'thousands',
    });

    expect(inputs.emailBody).toBeDefined();

    const strBody = bytesToString(Uint8Array.from(inputs.emailBody!.map((b) => Number(b))));

    const expected = 'h hundreds of thousands of blocks.'; // will round till previous 64x th byte

    expect(strBody.startsWith(expected)).toBeTruthy();
  });

  it('should throw if SHA precompute selector is invalid', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

    await expect(() =>
      generateEmailVerifierInputs(email, {
        shaPrecomputeSelector: 'Bla Bla',
      }),
    ).rejects.toThrow('SHA precompute selector "Bla Bla" not found in the body');
  });
});
