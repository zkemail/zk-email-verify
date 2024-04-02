function getHeaderValue(email: string, header: string) {
  const headerStartIndex = email.indexOf(`${header}: `) + header.length + 2;
  const headerEndIndex = email.indexOf("\n", headerStartIndex);
  const headerValue = email.substring(headerStartIndex, headerEndIndex);

  return headerValue;
}

function setHeaderValue(email: string, header: string, value: string) {
  return email.replace(getHeaderValue(email, header), value);
}


 // Google sets their own Message-ID and put the original one  in X-Google-Original-Message-ID
 // when ARC forwarding
function revertGoogleMessageId(email: string): string {
  // (Optional check) This only happens when google does ARC
  if (!email.includes("ARC-Authentication-Results")) {
    return email;
  }
  
  const googleReplacedMessageId = getHeaderValue(
    email,
    "X-Google-Original-Message-ID"
  );

  if (googleReplacedMessageId) {
    return setHeaderValue(email, "Message-ID", googleReplacedMessageId);
  }

  return email;
}

// Remove labels inserted to Subject - `[ListName] Newsletter 2024` to `Newsletter 2024`
function removeLabels(email: string): string {
  // Replace Subject: [label] with Subject:
  const sanitized = email.replace(/Subject: \[.*\]/, "Subject:");
  return sanitized;
}


const sanitizers = [
  revertGoogleMessageId,
  removeLabels,
];


export default sanitizers;
