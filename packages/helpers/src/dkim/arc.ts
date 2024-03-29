export async function revertCommonARCModifications(
  email: string
): Promise<string> {
  if (!email.includes("ARC-Authentication-Results")) {
    return email;
  }

  let modified = revertGoogleModifications(email);

  if (modified === email) {
    console.log("ARC Revert: No known ARC modifications found");
  }

  return modified;
}

function revertGoogleModifications(email: string): string {
  // Google sets their own Message-ID and put the original one
  // in X-Google-Original-Message-ID when forwarding
  const googleReplacedMessageId = getHeaderValue(
    email,
    "X-Google-Original-Message-ID"
  );

  if (googleReplacedMessageId) {
    email = setHeaderValue(email, "Message-ID", googleReplacedMessageId);

    console.info(
      "ARC Revert: Setting X-Google-Original-Message-ID to Message-ID header..."
    );
  }

  return email;
}

function getHeaderValue(email: string, header: string) {
  const headerStartIndex = email.indexOf(`${header}: `) + header.length + 2;
  const headerEndIndex = email.indexOf("\n", headerStartIndex);
  const headerValue = email.substring(headerStartIndex, headerEndIndex);

  return headerValue;
}

function setHeaderValue(email: string, header: string, value: string) {
  return email.replace(getHeaderValue(email, header), value);
}
