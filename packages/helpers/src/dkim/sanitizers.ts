function getHeaderValue(email: string, header: string) {
  const headerStartIndex = email.indexOf(`${header}: `) + header.length + 2;
  const headerEndIndex = email.indexOf('\n', headerStartIndex);
  const headerValue = email.substring(headerStartIndex, headerEndIndex);

  return headerValue;
}

function setHeaderValue(email: string, header: string, value: string) {
  return email.replace(getHeaderValue(email, header), value);
}

// Google sets their own Message-ID and put the original one  in X-Google-Original-Message-ID
// when ARC forwarding
// TODO: Add test for this
function revertGoogleMessageId(email: string): string {
  // (Optional check) This only happens when google does ARC
  if (!email.includes('ARC-Authentication-Results')) {
    return email;
  }

  const googleReplacedMessageId = getHeaderValue(email, 'X-Google-Original-Message-ID');

  if (googleReplacedMessageId) {
    return setHeaderValue(email, 'Message-ID', googleReplacedMessageId);
  }

  return email;
}

// Remove labels inserted to Subject - `[ListName] Newsletter 2024` to `Newsletter 2024`
function removeLabels(email: string): string {
  // Replace Subject: [label] with Subject:
  const sanitized = email.replace(/Subject: \[.*\]/, 'Subject:');
  return sanitized;
}

// Sometimes, newline encodings re-encode \r\n as just \n, so re-insert the \r
// TODO: Add test for this
function insert13Before10(email: string): string {
  const byteArray = new TextEncoder().encode(email);

  const ret = new Uint8Array(byteArray.length + 1000);

  let j = 0;
  for (let i = 0; i < byteArray.length; i++) {
    // Ensure each \n is preceded by a \r
    if (byteArray[i] === 10 && i > 0 && byteArray[i - 1] !== 13) {
      ret[j] = 13;
      j++;
    }
    ret[j] = byteArray[i];
    j++;
  }

  return Buffer.from(ret.slice(0, j).buffer).toString();
}

// Replace `=09` with `\t` in email
// TODO: Add test for this
function sanitizeTabs(email: string): string {
  return email.replace('=09', '\t');
}

const sanitizers = [revertGoogleMessageId, removeLabels, insert13Before10, sanitizeTabs];

export default sanitizers;
