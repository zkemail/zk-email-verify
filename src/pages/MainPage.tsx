// @ts-ignore
import React, { useMemo } from "react";
import { useState } from "react";
import { useAsync, useMount, useUpdateEffect } from "react-use";
// @ts-ignore
// @ts-ignore
import _ from "lodash";
// @ts-ignore
import {
  IGroupMessage,
  IGroupSignature,
  IIdentityRevealer,
} from "../helpers/groupSignature/types";
import {
  generateGroupSignature,
  getCircuitInputs,
} from "../helpers/groupSignature/sign";
import styled, { CSSProperties } from "styled-components";
import { sshSignatureToPubKey } from "../helpers/sshFormat";
import {
  verifyGroupSignature,
  verifyIdentityRevealer,
} from "../helpers/groupSignature/verify";
import { useSearchParams } from "react-router-dom";
import {
  decodeGroupSignature,
  decodeIdentityRevealer,
  encodeGroupSignature,
  encodeIdentityRevealer,
} from "../helpers/groupSignature/encoding";
import localforage from "localforage";

const LabeledTextArea: React.FC<{
  style?: CSSProperties;
  className?: string;
  label: string;
  value: string;
  warning?: string;
  warningColor?: string;
  disabled?: boolean;
  disabledReason?: string;
  link?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}> = ({
  style,
  warning,
  warningColor,
  disabled,
  disabledReason,
  label,
  value,
  onChange,
  link,
  className,
}) => {
  return (
    <LabeledTextAreaContainer
      className={_.compact(["labeledTextAreaContainer", className]).join(" ")}
    >
      <label>
        {label}
        {link && (
          <a
            style={{ color: "gray", marginLeft: 12 }}
            rel="noreferrer"
            target="_blank"
            href={link}
          >
            Share Link
          </a>
        )}
      </label>
      {warning && (
        <span className="warning" style={{ color: warningColor }}>
          {warning}
        </span>
      )}
      <textarea
        style={style}
        title={disabled ? disabledReason : ""}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
    </LabeledTextAreaContainer>
  );
};

function decodeSearchParams(urlSearchParams: URLSearchParams): {
  group_members?: string;
  message?: string;
  group_name?: string;
  enableSignerId: boolean;
  signerNamespace?: string;
  groupSignatureText?: string;
  identityRevealerText?: string;
} {
  const searchParams: {
    message?: string;
    group_name?: string;
    group_members?: string;
    enableSignerId?: string;
    signerNamespace?: string;
    groupSignatureText?: string;
    identityRevealerText?: string;
  } = Object.fromEntries(urlSearchParams.entries());
  return {
    group_members:
      searchParams.group_members &&
      decodeURIComponent(searchParams.group_members),
    message: searchParams.message && decodeURIComponent(searchParams.message),
    group_name:
      searchParams.group_name && decodeURIComponent(searchParams.group_name),
    signerNamespace:
      searchParams.signerNamespace &&
      decodeURIComponent(searchParams.signerNamespace),
    groupSignatureText:
      searchParams.groupSignatureText &&
      decodeURIComponent(searchParams.groupSignatureText),
    identityRevealerText:
      searchParams.identityRevealerText &&
      decodeURIComponent(searchParams.identityRevealerText),
    enableSignerId: !!searchParams.enableSignerId,
  };
}

function encodeMessageSearchParams(
  message: string,
  group_name: string,
  signerNamespace: string,
  group_members: string,
  enableSignerId: boolean
): string {
  const parts = _.compact([
    message && "message=" + encodeURIComponent(message),
    signerNamespace && "signerNamespace=" + encodeURIComponent(signerNamespace),
    group_name && "group_name=" + encodeURIComponent(group_name),
    group_members &&
      encodeURIComponent(group_members).length < 6800 &&
      "group_members=" + encodeURIComponent(group_members),
    enableSignerId && "enableSignerId=1",
  ]);
  return parts.join("&");
}

function encodeSignatureSearchParams(
  groupSignatureText: string,
  identityRevealerText?: string
): string {
  const parts = _.compact([
    groupSignatureText &&
      "groupSignatureText=" + encodeURIComponent(groupSignatureText),
    identityRevealerText &&
      "identityRevealerText=" + encodeURIComponent(identityRevealerText),
  ]);
  return parts.join("&");
}

export const MainPage: React.FC<{}> = (props) => {
  const parsedSearchParams = decodeSearchParams(useSearchParams()[0]);
  console.log(parsedSearchParams);
  // raw user inputs
  const [groupKeysString, setGroupKeysString] = useState<string>(
    parsedSearchParams.group_members || ""
  );
  const [signerNamespace, setSignerNamespace] = useState(
    parsedSearchParams.signerNamespace || ""
  );
  const [groupSignatureText, setGroupSignatureText] = useState<string>(
    parsedSearchParams.groupSignatureText ?? ""
  );
  const [identityRevealerText, setIdentityRevealerText] = useState<string>(
    parsedSearchParams.identityRevealerText || ""
  );
  const [message, setMessage] = useState(parsedSearchParams.message || "");
  const [groupName, setGroupName] = useState(
    parsedSearchParams.group_name || ""
  );
  const [doubleBlindKey, setDoubleBlindKey] = useState(
    localStorage.doubleBlindKey || ""
  );
  const [maskedIdentity, setMaskedIdentity] = useState<string>("");
  const [unmaskedIdentity, setUnmaskedIdentity] = useState<string>("");
  const [enableSignerId, setEnableSignerId] = useState(
    parsedSearchParams.enableSignerId ||
      !!identityRevealerText ||
      maskedIdentity.length > 1
  );
  const groupMessage: IGroupMessage = useMemo(
    () => ({
      signerNamespace: enableSignerId ? signerNamespace : "",
      enableSignerId,
      message,
      groupName,
      groupPublicKeys: _.sortBy(
        _.compact(groupKeysString.split("\n").map((s) => s.trim()))
      ),
    }),
    [enableSignerId, groupKeysString, groupName, message, signerNamespace]
  );

  const messageShareLink = useMemo(() => {
    return (
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?" +
      encodeMessageSearchParams(
        message,
        groupName,
        signerNamespace,
        groupKeysString,
        enableSignerId
      )
    );
  }, [enableSignerId, groupKeysString, groupName, message, signerNamespace]);
  console.log(messageShareLink, messageShareLink.length);
  const signatureShareLink = useMemo(() => {
    return (
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?" +
      encodeSignatureSearchParams(groupSignatureText)
    );
  }, [groupSignatureText]);
  const revealerShareLink = useMemo(() => {
    return (
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?" +
      encodeSignatureSearchParams(groupSignatureText, identityRevealerText)
    );
  }, [groupSignatureText, identityRevealerText]);

  // computed state
  const { value, error } = useAsync(async () => {
    try {
      const { circuitInputs, valid, identityRevealer, signerId } =
        await getCircuitInputs(doubleBlindKey, groupMessage);
      return { circuitInputs, valid, identityRevealer, signerId };
    } catch (e) {
      return {};
    }
  }, [doubleBlindKey, groupMessage]);

  const { circuitInputs, valid, identityRevealer, signerId } = value || {};
  console.log(circuitInputs);

  // state purely for displaying to user; not read outside of jsx
  const sshPubKey = useMemo(
    () => sshSignatureToPubKey(doubleBlindKey),
    [doubleBlindKey]
  );
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationPassed, setVerificationPassed] = useState(true);
  const [lastAction, setLastAction] = useState<"" | "sign" | "verify">("");

  useMount(() => {
    function handleKeyDown() {
      setLastAction("");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // local storage stuff
  useUpdateEffect(() => {
    if (value?.circuitInputs) {
      if (localStorage.doubleBlindKey !== doubleBlindKey) {
        console.info("Wrote key to localStorage");
        localStorage.doubleBlindKey = doubleBlindKey;
      }
    }
  }, [value]);
  if (error) console.error(error);
  return (
    <Container>
      <div className="title">
        <h1>Free RSA Group Signature Generator</h1>
      </div>
      <div className="main">
        <div className="messagePane">
          <LabeledTextArea
            label="Message"
            value={message}
            link={messageShareLink}
            onChange={(e) => {
              setMessage(e.currentTarget.value);
            }}
          />
          <LabeledTextArea
            label="Group Name"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.currentTarget.value);
            }}
          />
          <LabeledTextArea
            style={{ whiteSpace: "pre" }}
            label="Group Public Keys"
            value={groupKeysString}
            onChange={(e) => {
              setGroupKeysString(e.currentTarget.value);
            }}
            warning={
              valid &&
              !valid.validPublicKeyGroupMembership &&
              groupKeysString &&
              lastAction !== "verify"
                ? `Error: Your Double Dlind key does not correspond with any public key in the group.`
                : undefined
            }
          />

          {enableSignerId && (
            <LabeledTextArea
              label="Identity Namespace"
              value={signerNamespace}
              onChange={(e) => {
                setSignerNamespace(e.currentTarget.value);
              }}
            />
          )}
        </div>
        <div className="buttonsPane">
          <button
            disabled={
              !circuitInputs ||
              groupSignatureText ===
                "Computing ZK Proof... Please wait 30 seconds"
            }
            onClick={async () => {
              if (!circuitInputs) return;
              const setupCompleted = !!(await localforage.getItem(
                "rsa_group_sig_verify_0000.zkey"
              ));
              if (!setupCompleted) {
                alert(
                  "You must complete setup. Opening setup page in new window..."
                );
                window.open("/setup");
                return;
              }
              console.time("zk");
              setLastAction("sign");
              setVerificationMessage("");
              setIdentityRevealerText("");
              setUnmaskedIdentity("");
              setGroupSignatureText(
                "Computing ZK Proof... Please wait 30 seconds"
              );
              try {
                (window as any).cJson = JSON.stringify(circuitInputs);
                console.log(
                  "wrote circuit input to window.cJson. Run copy(cJson)"
                );
                if (identityRevealer) {
                  setMaskedIdentity(signerId!);
                  setUnmaskedIdentity(sshPubKey);
                  setIdentityRevealerText(
                    encodeIdentityRevealer(identityRevealer)
                  );
                }
                const groupSignature = await generateGroupSignature(
                  circuitInputs,
                  groupMessage,
                  signerId!
                );
                setGroupSignatureText(encodeGroupSignature(groupSignature));
              } catch (e) {
                setGroupSignatureText("Error Computing ZK Proof...");
                setIdentityRevealerText("");
                console.error(e);
              }
              console.timeEnd("zk");
            }}
          >
            Sign
            <br />
            {">>>"}
          </button>
          <button
            disabled={groupSignatureText.trim()[0] !== "-"}
            onClick={async () => {
              try {
                const groupSig: IGroupSignature =
                  decodeGroupSignature(groupSignatureText);
                const identityRevealer: IIdentityRevealer | null =
                  groupSig.groupMessage.enableSignerId && identityRevealerText
                    ? decodeIdentityRevealer(identityRevealerText)
                    : null;
                setLastAction("verify");

                setEnableSignerId(groupSig.groupMessage.enableSignerId);
                setSignerNamespace(groupSig.groupMessage.signerNamespace);
                setMessage(groupSig.groupMessage.message);
                setGroupName(groupSig.groupMessage.groupName);
                setGroupKeysString(
                  groupSig.groupMessage.groupPublicKeys.join("\n")
                );
                setMaskedIdentity(groupSig.signerId);
                if (identityRevealer) {
                  setUnmaskedIdentity(identityRevealer.pubKey);
                } else {
                  setUnmaskedIdentity("");
                }

                let ok = true;
                let message = [];
                if (await verifyGroupSignature(groupSig)) {
                  message.push("Signature is valid.");
                } else {
                  message.push("Error: Signature is invalid.");
                  ok = false;
                }

                if (identityRevealer) {
                  if (
                    await verifyIdentityRevealer(
                      identityRevealer,
                      groupSig.signerId
                    )
                  ) {
                    message.push("Identity revealer is valid.");
                  } else {
                    message.push("Error: Identity revealer is invalid.");
                    ok = false;
                  }
                }
                setVerificationMessage(message.join("\n"));
                setVerificationPassed(ok);
              } catch (er: any) {
                setVerificationMessage("Failed to verify " + er.toString());
                setVerificationPassed(false);
              }
            }}
          >
            Verify
            <br />
            {"<<<"}
          </button>
          <b>Options</b>
          <span>
            <label>
              <input
                type="checkbox"
                checked={enableSignerId}
                onChange={(e) => setEnableSignerId(e.currentTarget.checked)}
              />
              Secret ID
            </label>
          </span>
          {enableSignerId && (
            <LabeledTextArea
              className="small"
              label="Masked Identity"
              value={maskedIdentity}
              disabled
            />
          )}
          {enableSignerId && (
            <LabeledTextArea
              className="small"
              label="Unmasked Identity"
              value={unmaskedIdentity}
              disabled
            />
          )}
        </div>
        <div className="signaturePane">
          <LabeledTextArea
            label="Group Signature"
            link={signatureShareLink}
            value={groupSignatureText}
            onChange={(e) => {
              setGroupSignatureText(e.currentTarget.value);
            }}
            warning={verificationMessage}
            warningColor={verificationPassed ? "green" : "red"}
          />
          {enableSignerId && (
            <LabeledTextArea
              label="Identity Revealer"
              link={revealerShareLink}
              value={identityRevealerText}
              onChange={(e) => {
                setIdentityRevealerText(e.currentTarget.value);
              }}
            />
          )}
        </div>
      </div>
      <div className="bottom">
        <h3>Double Blind Key</h3>
        <div>
          If you wish to generate group signatures, you must input your personal
          Double Blind Key™.
          <br />
          This personal key is used by the generator to prove that you belong to
          the group.
          <br /> Generate the key from your personal SSH private key using
          following command.
          <br />
          NEVER share this key or your SSH private key with anyone. See{" "}
          <code>
            <a href="https://man7.org/linux/man-pages/man1/ssh-keygen.1.html">
              man ssh-keygen
            </a>
          </code>{" "}
          to learn more.
          <pre>
            echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n
            double-blind.xyz -f ~/.ssh/id_rsa
          </pre>
        </div>
        <br />
        <LabeledTextArea
          label="Your Double Blind Key"
          value={doubleBlindKey}
          onChange={(e) => {
            setDoubleBlindKey(e.currentTarget.value);
          }}
          warning={
            valid && doubleBlindKey && !valid.validSignatureFormat
              ? `Warning: Provided string is not an ssh-rsa signature`
              : valid && doubleBlindKey && !valid.validMessage
              ? `Warning: Provided SSH Signature is not a Double Blind Key.`
              : undefined
          }
        />
        <LabeledTextArea label="Your Public Key" value={sshPubKey} disabled />
      </div>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  & .title {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  & .main {
    display: flex;
    & .messagePane {
      flex: 1;
      display: flex;
      flex-direction: column;
      & > .div {
        display: flex;
      }
    }
    & .buttonsPane {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 12px;
      & button {
        margin-bottom: 16px;
        width: 120px;
      }
    }
    & .signaturePane {
      flex: 1;
      display: flex;
      flex-direction: column;
      & > :first-child {
        height: calc(30vh + 32px);
      }
    }
  }

  & .bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    & p {
      text-align: center;
    }
    & .labeledTextAreaContainer {
      align-self: center;
      max-width: 50vw;
      width: 500px;
    }
  }
`;

const LabeledTextAreaContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 10vh;
  padding: 8px 24px;
  align-items: center;
  & label {
    font-size: 20px;
  }
  & textarea {
    align-self: stretch;
    margin-top: 12px;
    flex: 1;
  }
  & .warning {
    color: #bd3333;
    font-size: 80%;
  }
  &.small {
    label {
      font-size: 16px;
    }
    height: 7vh;

    textarea {
      align-self: center;
      width: 120px;
    }
  }
`;
