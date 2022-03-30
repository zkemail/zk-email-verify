// @ts-ignore
import React, { useEffect, useMemo } from "react";
import { useState } from "react";
import { useAsync, useUpdateEffect } from "react-use";
// @ts-ignore
import sshpk from "sshpk";
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
const DEFAULT_PUBLIC_KEY_1 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_PUBLIC_KEY_2 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDRvpOL7TZcYtHsSSz4lj8vTyIEuFSQnUqHTxhhsEWzAbq9LHMqYm4Whg1oRm430QvJF5xfOaLk+bmO6hN1g4Y9yJUj4uhaNSfSl3wGLBxu5OQNngnIDCbxTLjat4Jgz79ZiAo79c6bVq13xcfG0fjtFoC3FbZD0VEmqmwd/lYCLLVqtjccQur8B56O9Pj/giDMby0iQPFEe9vlpP8Wg3WVjFRQkwNOhGzvLNrlOBkJXpG9xty43O9T09qHJzKYobrAnlKeRTqYqppVfwmYI7rqr2rqTXF9mBB4s1zUCXJzTVrnqexzeH+Uv54KIaXxR2CAn3+DDtDBfJ4wqk/8OBNN";

const LabeledTextArea: React.FC<{
  style?: CSSProperties;
  label: string;
  value: string;
  warning?: string;
  disabled?: boolean;
  disabledReason?: string;
  link?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}> = ({
  style,
  warning,
  disabled,
  disabledReason,
  label,
  value,
  onChange,
  link,
}) => {
  return (
    <LabeledTextAreaContainer className="labeledTextAreaContainer">
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
      {warning && <span className="warning">{warning}</span>}
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

function decodeSearchParams(
  urlSearchParams: URLSearchParams
): {
  group_members?: string;
  message?: string;
  group_name?: string;
  topic?: string;
  enableSignerId: boolean;
  groupSignatureText?: string;
  identityRevealerText?: string;
} {
  const searchParams: {
    message?: string;
    group_name?: string;
    topic?: string;
    group_members?: string;
    enableSignerId?: string;
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
    topic: searchParams.topic && decodeURIComponent(searchParams.topic),
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
  topic: string,
  group_members: string,
  enableSignerId: boolean
): string {
  const parts = _.compact([
    message && "message=" + encodeURIComponent(message),
    topic && "topic=" + encodeURIComponent(topic),
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

export const Prover: React.FC<{}> = (props) => {
  const parsedSearchParams = decodeSearchParams(useSearchParams()[0]);
  console.log(parsedSearchParams);
  // raw user inputs
  const [groupKeysString, setGroupKeysString] = useState<string>(
    parsedSearchParams.group_members ||
      DEFAULT_PUBLIC_KEY_1 + "\n" + DEFAULT_PUBLIC_KEY_2 + "\n"
  );
  const [topic, setTopic] = useState(
    parsedSearchParams.topic || "Cats vs Dogs"
  );
  const [groupSignatureText, setGroupSignatureText] = useState<string>(
    parsedSearchParams.groupSignatureText ||
      `{"zkProof":{"pi_a":["6000829438682222660174117415926153560479766109615372223604045665744621230330","7828239351267593778556013466895745378909567573732704401138006895516830058152","1"],"pi_b":[["13393755824685159455751841687025013227537943368178214006637931063316219641717","2113090536437135750339716079669225728181430322424640234256971499571869487967"],["17727197276740648928663829528855876269602357580298062215812492563180713912174","18288078167044507149549045030332503038358185994393186712607545458965071966279"],["1","0"]],"pi_c":["5247133052745558326131157858776702895526545010037263288953019169823676425745","4235036826904824476318161255501712210660707701419836555689661404053631260107","1"],"protocol":"groth16","curve":"bn128"},"signerId":"0","groupMessage":{"topic":"Cats vs Dogs","enableSignerId":false,"message":"I like cats","groupName":"https://github.com/orgs/doubleblind-xyz/people","groupPublicKeys":["ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local","ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDRvpOL7TZcYtHsSSz4lj8vTyIEuFSQnUqHTxhhsEWzAbq9LHMqYm4Whg1oRm430QvJF5xfOaLk+bmO6hN1g4Y9yJUj4uhaNSfSl3wGLBxu5OQNngnIDCbxTLjat4Jgz79ZiAo79c6bVq13xcfG0fjtFoC3FbZD0VEmqmwd/lYCLLVqtjccQur8B56O9Pj/giDMby0iQPFEe9vlpP8Wg3WVjFRQkwNOhGzvLNrlOBkJXpG9xty43O9T09qHJzKYobrAnlKeRTqYqppVfwmYI7rqr2rqTXF9mBB4s1zUCXJzTVrnqexzeH+Uv54KIaXxR2CAn3+DDtDBfJ4wqk/8OBNN"]}}`
  );
  const [identityRevealerText, setIdentityRevealerText] = useState<string>(
    parsedSearchParams.identityRevealerText || ""
  );
  const [message, setMessage] = useState(
    parsedSearchParams.message || "I like cats"
  );
  const [groupName, setGroupName] = useState(
    parsedSearchParams.group_name ||
      "https://github.com/orgs/doubleblind-xyz/people" // TODO merkle.club/github/orgs/doubleblind-xyz
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
      topic: enableSignerId ? topic : "",
      enableSignerId,
      message,
      groupName,
      groupPublicKeys: _.sortBy(
        _.compact(groupKeysString.split("\n").map((s) => s.trim()))
      ),
    }),
    [enableSignerId, groupKeysString, groupName, message, topic]
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
        topic,
        groupKeysString,
        enableSignerId
      )
    );
  }, [enableSignerId, groupKeysString, groupName, message, topic]);
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
      const {
        circuitInputs,
        valid,
        identityRevealer,
        signerId,
      } = await getCircuitInputs(doubleBlindKey, groupMessage);
      return { circuitInputs, valid, identityRevealer, signerId };
    } catch (e) {
      return {};
    }
  }, [doubleBlindKey, groupMessage]);

  const { circuitInputs, valid, identityRevealer, signerId } = value || {};
  console.log(circuitInputs);

  // state purely for displaying to user; not read outside of jsx
  const sshPubKey = useMemo(() => sshSignatureToPubKey(doubleBlindKey), [
    doubleBlindKey,
  ]);
  const [verificationMessage, setVerificationMessage] = useState("");

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
      <h2>Zero Knowledge RSA Group Signature Generator</h2>
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
              valid && !valid.validPublicKeyGroupMembership
                ? `Error: Secret identity does not correspond with any public key in the group.`
                : undefined
            }
          />

          {enableSignerId && (
            <LabeledTextArea
              label="Identity Namespace"
              value={topic}
              onChange={(e) => {
                setTopic(e.currentTarget.value);
              }}
            />
          )}
        </div>
        <div className="buttonsPane">
          <button
            disabled={groupSignatureText.trim()[0] !== "-"}
            onClick={async () => {
              try {
                const groupSig: IGroupSignature = decodeGroupSignature(
                  groupSignatureText
                );
                const identityRevealer: IIdentityRevealer | null =
                  groupSig.groupMessage.enableSignerId && identityRevealerText
                    ? decodeIdentityRevealer(identityRevealerText)
                    : null;

                setEnableSignerId(groupSig.groupMessage.enableSignerId);
                setTopic(groupSig.groupMessage.topic);
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

                let message = [];
                if (await verifyGroupSignature(groupSig)) {
                  message.push("Signature is valid.");
                } else {
                  message.push("Error: Signature is invalid.");
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
                  }
                }
                setVerificationMessage(message.join("\n"));
              } catch (er: any) {
                setVerificationMessage("Failed to verify " + er.toString());
              }
            }}
          >
            Verify
          </button>
          <button
            disabled={
              !circuitInputs ||
              groupSignatureText ===
                "Computing ZK Proof... Please wait 30 seconds"
            }
            onClick={async () => {
              if (!circuitInputs) return;
              console.time("zk");
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
          </button>

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
              label="Masked Identity"
              value={maskedIdentity}
              disabled
            />
          )}
          {enableSignerId && (
            <LabeledTextArea
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
        <h3>DoubleBlind Key</h3>
        <div>
          If you wish to generate group signatures, you must input your personal
          DoubleBlind Key™.
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
            doubleblind.xyz -f ~/.ssh/id_rsa
          </pre>
        </div>
        <br />
        <LabeledTextArea
          label="Your DoubleBlind Key"
          value={doubleBlindKey}
          onChange={(e) => {
            setDoubleBlindKey(e.currentTarget.value);
          }}
          warning={
            valid && !valid.validSignatureFormat
              ? `Warning: Provided string is not an ssh-rsa signature`
              : valid && !valid.validMessage
              ? `Warning: Provided SSH Signature is not a DoubleBlind Key.`
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
    align-items: stretch;
    padding: 12px;

  }
  & .signaturePane {
    flex: 1;
    display: flex;
    flex-direction: column;
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
  padding: 8px 24px;
  & label {
    align-self: center;
    font-size: 20px;
  }
  & textarea {
    margin-top: 12px;
    height: 70px;
  }
  & .warning {
    color: #bd3333;
    font-size: 80%;
  }
`;
