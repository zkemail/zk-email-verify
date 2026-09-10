import fs from 'fs';
import path from 'path';
import { verifyDKIMSignature } from '../src/dkim';
import * as dnsOverHttp from '../src/dkim/dns-over-http';
import * as dnsArchive from '../src/dkim/dns-archive';
import { DkimVerifier } from '../src/lib/mailauth/dkim-verifier';
import { writeToStream } from '../src/lib/mailauth/tools';

jest.setTimeout(10000);

describe('DKIM signature verification', () => {
  it('should pass for valid email', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

    const result = await verifyDKIMSignature(email);

    expect(result.signingDomain).toBe('icloud.com');
    expect(result.appliedSanitization).toBeFalsy();
  });

  it('should fail for invalid selector', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-invalid-selector.eml'));

    expect.assertions(1);

    try {
      await verifyDKIMSignature(email);
    } catch (e) {
      expect(e.message).toBe('DKIM signature verification failed for domain icloud.com. Reason: no key');
    }
  });

  it('should fail for tampered body', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-body-tampered.eml'));

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
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-invalid-domain.eml'));

    expect.assertions(1);

    try {
      await verifyDKIMSignature(email);
    } catch (e) {
      expect(e.message).toBe('DKIM signature not found for domain gmail.com');
    }
  });

  it('should be able to override domain', async () => {
    // From address domain is icloud.com
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-different-domain.eml'));

    // Should pass with default domain
    await verifyDKIMSignature(email);

    // Should fail because the email wont have a DKIM signature with the overridden domain
    // Can be replaced with a better test email where signer is actually
    // different from From domain and the below check pass.
    expect.assertions(1);
    try {
      await verifyDKIMSignature(email, 'domain.com');
    } catch (e) {
      expect(e.message).toBe('DKIM signature not found for domain domain.com');
    }
  });

  it('should skip body-hash verification for body-less emails', async () => {
    // From address domain is icloud.com
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-bodyless.eml'));

    // Should pass with default domain
    const result = await verifyDKIMSignature(email, '', true, false, true);
    expect.assertions(1);
    expect(result.signingDomain).toBe('icloud.com');
  });

  it('should pass for tampered body if skipBodyHash=true', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-body-tampered.eml'));

    try {
      await verifyDKIMSignature(email, '', true, false, true);
    } catch (e) {
      expect(e.message).toBe(
        'DKIM signature verification failed for domain icloud.com. Reason: body hash did not verify',
      );
    }
  });
});

it('should fallback to ZK Email Archive if DNS over HTTP fails', async () => {
  const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

  // Mock resolveDNSHTTP to throw an error just for this test
  const mockResolveDNSHTTP = jest
    .spyOn(dnsOverHttp, 'resolveDNSHTTP')
    .mockRejectedValue(new Error('Failed due to mock'));

  // Should succeed using Archive keys even though DNS failed
  const result = await verifyDKIMSignature(email, 'icloud.com', true, true);
  expect(result.signingDomain).toBe('icloud.com');

  mockResolveDNSHTTP.mockRestore();
});

it('should try multiple DKIM keys when archive returns multiple records for same selector', async () => {
  const email = fs.readFileSync(path.join(__dirname, 'test-data/multi-dkim-sig.eml'));

  // Mock resolveDNSHTTP to throw an error to force using archive keys
  const mockResolveDNSHTTP = jest
    .spyOn(dnsOverHttp, 'resolveDNSHTTP')
    .mockRejectedValue(new Error('Failed due to mock'));

  // This email requires trying multiple keys from the archive before finding the correct one
  // Archive returns 7 keys for selector 'hs2', and the 6th one is the correct key
  const result = await verifyDKIMSignature(email, 'bf01.eu1.hubspotstarter.net', false, true);

  // Verify signature passed with one of the multiple keys
  expect(result.signingDomain).toBe('bf01.eu1.hubspotstarter.net');
  expect(result.selector).toBe('hs2');

  mockResolveDNSHTTP.mockRestore();
}, 20000);

it('should query both DNS and Archive in parallel and succeed with historical key', async () => {
  const email = fs.readFileSync(path.join(__dirname, 'test-data/multi-dkim-sig.eml'));

  // NO MOCKING - This test verifies the fix with real API calls
  // The email was signed with an old rotated key (key #6 from May 2025)
  // DNS will return the CURRENT key (Oct 2025) which is WRONG for this email
  // Archive will return 7 historical keys including the correct one
  // With the fix, both sources are queried and keys are combined
  // Verification should succeed with the correct historical key from archive

  // Spy on both functions to verify they are both called
  const dnsHttpSpy = jest.spyOn(dnsOverHttp, 'resolveDNSHTTP');
  const archiveSpy = jest.spyOn(dnsArchive, 'resolveDNSFromZKEmailArchive');

  const result = await verifyDKIMSignature(email, 'bf01.eu1.hubspotstarter.net', false, true);

  // Verify signature passed
  expect(result.signingDomain).toBe('bf01.eu1.hubspotstarter.net');
  expect(result.selector).toBe('hs2');

  // Verify both DNS and Archive were called (not just archive as fallback)
  expect(dnsHttpSpy).toHaveBeenCalled();
  expect(archiveSpy).toHaveBeenCalled();

  dnsHttpSpy.mockRestore();
  archiveSpy.mockRestore();
}, 20000);

it('should fail on DNS over HTTP failure if fallback is not enabled', async () => {
  const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

  // Mock resolveDNSHTTP to throw an error just for this test
  const mockResolveDNSHTTP = jest
    .spyOn(dnsOverHttp, 'resolveDNSHTTP')
    .mockRejectedValue(new Error('Failed due to mock'));

  expect.assertions(1);
  try {
    await verifyDKIMSignature(email, 'icloud.com', true, false);
  } catch (e) {
    expect(e.message).toBe('DKIM signature verification failed for domain icloud.com. Reason: no key');
  }
  mockResolveDNSHTTP.mockRestore();
});

it('should fail if both DNS over HTTP and ZK Email Archive fail', async () => {
  const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

  const mockResolveDNSHTTP = jest
    .spyOn(dnsOverHttp, 'resolveDNSHTTP')
    .mockRejectedValue(new Error('Failed due to mock'));

  const mockResolveDNSFromZKEmailArchive = jest
    .spyOn(dnsArchive, 'resolveDNSFromZKEmailArchive')
    .mockRejectedValue(new Error('Failed due to mock'));

  expect.assertions(1);
  try {
    await verifyDKIMSignature(email, 'icloud.com', true, true);
  } catch (e) {
    expect(e.message).toBe('DKIM signature verification failed for domain icloud.com. Reason: no key');
  }

  mockResolveDNSHTTP.mockRestore();
  mockResolveDNSFromZKEmailArchive.mockRestore();
});

describe('DKIM with sanitization', () => {
  it('should pass after removing label from Subject', async () => {
    const email = fs.readFileSync(path.join(__dirname, 'test-data/email-good.eml'));

    // Add a label to the subject
    const tamperedEmail = email.toString().replace('Subject: ', 'Subject: [EmailListABC]');

    const result = await verifyDKIMSignature(tamperedEmail);

    expect(result.appliedSanitization).toBe('removeLabels');
  });
});

describe('DKIM skipped headers', () => {
  it('should correctly identify skip reasons for invalid signature headers', async () => {
    const dkimVerifier = new DkimVerifier({
      resolver: async () => {},
      skipBodyHash: false,
    });

    // Test with invalid signing algorithm
    const invalidAlgoHeader = {
      type: 'DKIM',
      signAlgo: 'invalid-algorithm',
      hashAlgo: 'sha256',
      headerCanon: 'relaxed',
      bodyCanon: 'relaxed',
      signingDomain: 'example.com',
      selector: 'test',
    };

    const skipReasons = dkimVerifier['getSkipReasons'](invalidAlgoHeader);
    expect(skipReasons).toContain('invalid signing algorithm: invalid-algorithm');

    // Test with missing domain
    const missingDomainHeader = {
      type: 'DKIM',
      signAlgo: 'rsa',
      hashAlgo: 'sha256',
      headerCanon: 'relaxed',
      bodyCanon: 'relaxed',
      signingDomain: '',
      selector: 'test',
    };

    const skipReasons2 = dkimVerifier['getSkipReasons'](missingDomainHeader);
    expect(skipReasons2).toContain('missing signing domain');

    // Test with missing selector
    const missingSelectorHeader = {
      type: 'DKIM',
      signAlgo: 'rsa',
      hashAlgo: 'sha256',
      headerCanon: 'relaxed',
      bodyCanon: 'relaxed',
      signingDomain: 'example.com',
      selector: '',
    };

    const skipReasons3 = dkimVerifier['getSkipReasons'](missingSelectorHeader);
    expect(skipReasons3).toContain('missing selector');
  });
});
