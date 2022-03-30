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
  computeIdentityRevealer,
  generateGroupSignature,
  getCircuitInputs,
} from "../helpers/groupSignature/sign";
import styled from "styled-components";
import { sshSignatureToPubKey } from "../helpers/sshFormat";
import { verifyGroupSignature } from "../helpers/groupSignature/verify";
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
  // raw user inputs
  const [groupKeysString, setGroupKeysString] = useState<string>(
    DEFAULT_PUBLIC_KEY_1 + "\n" + DEFAULT_PUBLIC_KEY_2 + "\n"
  );
  const [topic, setTopic] = useState("Cats vs Dogs");
  const [groupSignatureText, setGroupSignatureText] = useState<string>(
    `{"zkProof":{"pi_a":["7791150101049148030334922712894460976891438507772725293675503708769850324408","4807011716615281121264305442881463487508614089034494068637557537477837914804","1"],"pi_b":[["19139482178762204430487850663050554457352287067649366141140895135592209755996","14587543754154539836960847125496327696474890410801933702680359202563943620753"],["12770795568538194983646350394261872967965245996197983898273602440731913180568","9660267156832844442269396438809093908369232774980538372354372293780963655898"],["1","0"]],"pi_c":["11073493114019922389315448922286296731672439640661596580481054857194382633019","4887331988533735869137617582895764722479117804376027740236908137822399675595","1"],"protocol":"groth16","curve":"bn128"},"groupMessage":{"topic":"Cats vs Dogs","enableSignerId":false,"message":"I like cats","groupName":"https://github.com/orgs/doubleblind-xyz/people","groupPublicKeys":["ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local","ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDiIy+zqA142+M+GJvVV6Q+YCzic8ZjEzGduW/qtl+vMIx1fUU0GgWoyO3P6FnOr5AGkW4z8NG+CZaDdotwaes3IErJosDzMtAPbF1AfDYs4jIg3HCEC3ZGi2a6X5/TxiSVMAk79k4A6s8td/wP6dGInPVDdqKfhVsACn7NboJHUsqRurImHNVKpuqU9SvO+u10LFm/cSP7bkUkhLjAmlP3TN6MmupvU7JgIRqM1GMYr7yismap0w4fHfISE2jxQ9xcfV1QL2uHF7Wy3jr5uPXYn5LoNQjKw+PpL2ZaQGVVre3V4gBztr8loKo/Gkkg4JTsDk5yiACBMRHGLy4dS0wl stevenhao@Stevens-MacBook-Pro.local","ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDBN+ISLXgsf3xxG18ZSKAwARj/0mw0x8JGQoWuCcDB5C99bgC5CMIsm/7ZYHye6BdB7GbY3RV/aVuLzm2lh2Q9opPT2AJhWDdeYyLhrIRsexNfnUXZsETxI4M7P5mZXNHAVASG/Q/gu2lb1aPt5oOiRCI7tvitKLOGrUtb0/KToaityX2OJFmEnmH+RM6t2ICwmfObterWjzm+J5k1ydFjSSwkx669U/GWVf56Rruburz/XlDwUm9liVef5iTOH8/rSu82ejamZXoYJFCaSq3nCZRw8mb6xs+zoiYcKiGozlhg6Zbpkexr4i20vPR5d9rQItaZ38cmbk2HwZzpaqUx/t055CpmUQ2N/vfvzr3rUCeG0SkWsew0m8UDB0AU6LYKCQS50kr0KBYEtE+lt46iLf+5XrlBhFj99xqx5qOeSY9Pz8xuu3Ti2ckDKhyMTj9uONSBPVOxRslX8PK35L0lQdM8TOjKBpVAWx4Fyag93QWyPFdUD4kB+HHSo9FgC9vZxtoxPOpTf8GgIzspGVHL+MjW7QmBs+cD48K9k6XMmaSq1AEx1JjeysoO5d9bzTygyHAhyZtZftnaTQ6r8OjUGL+U9J16Ezp1CwxY8tHpIyh2e6HUuVE8CNkeKLf6j2VIgdQd7b+iSPtr3bc43tMYRW9576Qov/t8pP8gEla83w=="]}}`
  );
  const [identityRevealerText, setIdentityRevealerText] = useState<string>("");
  const [message, setMessage] = useState("I like cats");
  const [groupName, setGroupName] = useState(
    "https://github.com/orgs/doubleblind-xyz/people" // TODO merkle.club/github/orgs/doubleblind-xyz
  );
  const [doubleBlindKey, setDoubleBlindKey] = useState(
    localStorage.doubleBlindKey || ""
  );
  const [secretIdentity, setSecretIdentity] = useState<string>("");
  const [enableSignerId, setEnableSignerId] = useState(false);
  const groupMessage: IGroupMessage = useMemo(
    () => ({
      topic,
      enableSignerId,
      message,
      groupName,
      groupPublicKeys: _.sortBy(
        _.compact(groupKeysString.split("\n").map((s) => s.trim()))
      ),
    }),
    [enableSignerId, groupKeysString, groupName, message, topic]
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
  console.log(circuitInputs);
  // state purely for displaying to user; not read outside of jsx
  const sshPubKey = useMemo(() => sshSignatureToPubKey(doubleBlindKey), [
    doubleBlindKey,
  ]);
  const [verificationMessage, setVerificationMessage] = useState("I like cats");

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
                ? `Error: Secret identity does not correspond with any public key in the group.`
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

          {enableSignerId && (
            <LabeledTextArea
              warning={
                secretIdentity !== sshPubKey
                  ? "Warning: Secret identity is not your public key"
                  : undefined
              }
              label="Secret Identity"
              value={secretIdentity}
              onChange={(e) => {
                setSecretIdentity(e.currentTarget.value);
              }}
            />
          )}
        </div>
        <div className="buttonsPane">
          <button
            disabled={groupSignatureText.trim()[0] !== "{"}
            onClick={async () => {
              try {
                const groupSig = JSON.parse(groupSignatureText);
                await verifyGroupSignature(groupSig);
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
              setIdentityRevealerText(
                JSON.stringify(
                  computeIdentityRevealer(circuitInputs, sshPubKey)
                )
              );
              setGroupSignatureText(
                "Computing ZK Proof... Please wait 30 seconds"
              );
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
                setIdentityRevealerText("");
                console.error(e);
              }
              console.timeEnd("zk");
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
            <label>Secret ID</label>
          </span>
        </div>
        <div className="signaturePane">
          <LabeledTextArea
            label="Group Signature"
            value={groupSignatureText}
            onChange={(e) => {
              setGroupSignatureText(e.currentTarget.value);
            }}
          />
          {enableSignerId && (
            <LabeledTextArea
              label="Identity Revealer"
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
        <LabeledTextArea
          label="Your Secret Identity"
          value={sshPubKey}
          disabled
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
