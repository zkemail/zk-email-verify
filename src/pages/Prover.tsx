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
} from "../helpers/groupSignature/types";
import {
  generateGroupSignature,
  getCircuitInputs,
} from "../helpers/groupSignature/sign";
import styled from "styled-components";
import { sshSignatureToPubKey } from "../helpers/sshFormat";
const DEFAULT_PUBLIC_KEY_1 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_PUBLIC_KEY_2 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDiIy+zqA142+M+GJvVV6Q+YCzic8ZjEzGduW/qtl+vMIx1fUU0GgWoyO3P6FnOr5AGkW4z8NG+CZaDdotwaes3IErJosDzMtAPbF1AfDYs4jIg3HCEC3ZGi2a6X5/TxiSVMAk79k4A6s8td/wP6dGInPVDdqKfhVsACn7NboJHUsqRurImHNVKpuqU9SvO+u10LFm/cSP7bkUkhLjAmlP3TN6MmupvU7JgIRqM1GMYr7yismap0w4fHfISE2jxQ9xcfV1QL2uHF7Wy3jr5uPXYn5LoNQjKw+PpL2ZaQGVVre3V4gBztr8loKo/Gkkg4JTsDk5yiACBMRHGLy4dS0wl stevenhao@Stevens-MacBook-Pro.local";

const LabeledTextArea: React.FC<{
  label: string;
  value: string;
  warning?: string;
  disabled?: boolean;
  disabledReason?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}> = ({ warning, disabled, disabledReason, label, value, onChange }) => {
  return (
    <LabeledTextAreaContainer className="labeledTextAreaContainer">
      <label>{label}</label>
      {warning && <span className="warning">{warning}</span>}
      <textarea
        title={disabled ? disabledReason : ""}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
    </LabeledTextAreaContainer>
  );
};
export const Prover: React.FC<{}> = (props) => {
  const [groupKeysString, setGroupKeysString] = useState<string>(
    DEFAULT_PUBLIC_KEY_1 + "\n" + DEFAULT_PUBLIC_KEY_2
  );
  const [topic, setTopic] = useState("Cats vs Dogs");
  const [groupSignatureText, setGroupSignatureText] = useState<string>("");
  const [message, setMessage] = useState("I like cats");
  const [groupName, setGroupName] = useState(
    "https://github.com/orgs/doubleblind-xyz/people" // TODO merkle.club/github/orgs/doubleblind-xyz
  );
  const [doubleBlindKey, setDoubleBlindKey] = useState(
    localStorage.doubleBlindKey || ""
  );
  const sshPubKey = useMemo(() => sshSignatureToPubKey(doubleBlindKey), [
    doubleBlindKey,
  ]);
  const [enableSignerId, setEnableSignerId] = useState(false);
  const groupMessage: IGroupMessage = useMemo(
    () => ({
      topic,
      enableSignerId,
      message,
      groupName,
      groupPublicKeys: _.sortBy(groupKeysString.split("\n")),
    }),
    [groupKeysString, groupName, message, topic]
  );
  const { value, error } = useAsync(async () => {
    try {
      const { circuitInputs, valid } = await getCircuitInputs(
        doubleBlindKey,
        groupMessage
      );
      return { circuitInputs, valid };
    } catch (e) {
      return {};
    }
  }, [doubleBlindKey, groupMessage]);
  useUpdateEffect(() => {
    if (value?.circuitInputs) {
      if (localStorage.doubleBlindKey !== doubleBlindKey) {
        console.info("Wrote key to localStorage");
        localStorage.doubleBlindKey = doubleBlindKey;
      }
    }
  }, [value]);
  const { circuitInputs, valid } = value || {};
  if (error) console.error(error);
  return (
    <Container>
      <h2>Zero Knowledge RSA Group Signature Generator</h2>
      <div className="main">
        <div className="messagePane">
          <LabeledTextArea
            label="Message"
            value={message}
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
            label="Group Public Keys"
            value={groupKeysString}
            onChange={(e) => {
              setGroupKeysString(e.currentTarget.value);
            }}
            warning={
              valid && !valid.validPublicKeyGroupMembership
                ? `Warning: Provided SSH Signature does not correspond with any public key in the group.`
                : undefined
            }
          />
          <LabeledTextArea
            label="Topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.currentTarget.value);
            }}
          />
        </div>
        <div className="buttonsPane">
          <button
            disabled={!circuitInputs}
            onClick={async () => {
              if (!circuitInputs) return;
              if (groupSignatureText === "Computing ZK Proof...") {
                return;
              }
              setGroupSignatureText("Computing ZK Proof...");
              try {
                (window as any).cJson = JSON.stringify(circuitInputs);
                console.log(
                  "wrote circuit input to window.cJson. Run copy(cJson)"
                );
                const groupSignature = await generateGroupSignature(
                  circuitInputs,
                  groupMessage
                );
                setGroupSignatureText(JSON.stringify(groupSignature));
              } catch (e) {
                setGroupSignatureText("Error Computing ZK Proof...");
                console.error(e);
              }
            }}
          >
            Sign
          </button>
          <span>
            <input
              type="checkbox"
              checked={enableSignerId}
              onChange={(e) => setEnableSignerId(e.currentTarget.checked)}
            />
            <label>Signer ID</label>
          </span>
        </div>
        <div className="signaturePane">
          <LabeledTextArea
            label="Group Signature JSON String"
            value={groupSignatureText}
            onChange={(e) => {
              setGroupSignatureText(e.currentTarget.value);
            }}
          />
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
        <LabeledTextArea
          label="Your Public SSH Key"
          disabled
          value={sshPubKey}
        />
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
    align-items: center;
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
