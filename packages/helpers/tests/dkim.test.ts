import fs from 'fs';
import path from 'path';
import { verifyDKIMSignature } from '../src/dkim';

jest.setTimeout(10000);

describe('DKIM signature verification', () => {
  it('should pass for valid email', async () => {
    const email = fs.readFileSync(
      path.join(__dirname, 'test-data/email-good.eml'),
    );

    const result = await verifyDKIMSignature(email);

    expect(result.signingDomain).toBe('icloud.com');
    expect(result.appliedSanitization).toBeFalsy();
  });

  it('should fail for invalid selector', async () => {
    const email = fs.readFileSync(
      path.join(__dirname, 'test-data/email-invalid-selector.eml'),
    );

    expect.assertions(1);

    try {
      await verifyDKIMSignature(email);
    } catch (e) {
      expect(e.message).toBe(
        'DKIM signature verification failed for domain icloud.com. Reason: no key',
      );
    }
  });

  it('should fail for tampered body', async () => {
    const email = fs.readFileSync(
      path.join(__dirname, 'test-data/email-body-tampered.eml'),
    );

    expect.assertions(1);

    try {
      await verifyDKIMSignature(email);
    } catch (e) {
      expect(e.message).toBe(
        'DKIM signature verification failed for domain icloud.com. Reason: body hash did not verify',
      );
    }
  });

  it('should fail for when DKIM signature is not present for domain', async () => {
    // In this email From address is user@gmail.com, but the DKIM signature is only for icloud.com
    const email = fs.readFileSync(
      path.join(__dirname, 'test-data/email-invalid-domain.eml'),
    );

    expect.assertions(1);

    try {
      await verifyDKIMSignature(email);
    } catch (e) {
      expect(e.message).toBe(
        'DKIM signature not found for domain gmail.com',
      );
    }
  });

  it('should be able to override domain', async () => {
    // From address domain is icloud.com
    const email = fs.readFileSync(
      path.join(__dirname, 'test-data/email-different-domain.eml'),
    );

    // Should pass with default domain
    await verifyDKIMSignature(email);

    // Should fail because the email wont have a DKIM signature with the overridden domain
    // Can be replaced with a better test email where signer is actually
    // different from From domain and the below check pass.
    expect.assertions(1);
    try {
      await verifyDKIMSignature(email, 'domain.com');
    } catch (e) {
      expect(e.message).toBe(
        'DKIM signature not found for domain domain.com',
      );
    }
  });
});

describe('DKIM with sanitization', () => {
  it('should pass after removing label from Subject', async () => {
    const email = fs.readFileSync(
      path.join(__dirname, 'test-data/email-good.eml'),
    );

    // Add a label to the subject
    const tamperedEmail = email.toString().replace('Subject: ', 'Subject: [EmailListABC]');

    const result = await verifyDKIMSignature(tamperedEmail);

    expect(result.appliedSanitization).toBe('removeLabels');
  });
});
