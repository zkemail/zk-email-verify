// @ts-ignore
import React from "react";
import { useState } from "react";
import { useAsync } from "react-use";
// @ts-ignore
import sshpk from "sshpk";
// @ts-ignore
import _ from "lodash";
// @ts-ignore
import { IGroupSignature } from "../helpers/groupSignature/types";
import {
  generateGroupSignature,
  getCircuitInputs,
} from "../helpers/groupSignature/sign";

const DEFAULT_PUBLIC_KEY_1 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_PUBLIC_KEY_2 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDiIy+zqA142+M+GJvVV6Q+YCzic8ZjEzGduW/qtl+vMIx1fUU0GgWoyO3P6FnOr5AGkW4z8NG+CZaDdotwaes3IErJosDzMtAPbF1AfDYs4jIg3HCEC3ZGi2a6X5/TxiSVMAk79k4A6s8td/wP6dGInPVDdqKfhVsACn7NboJHUsqRurImHNVKpuqU9SvO+u10LFm/cSP7bkUkhLjAmlP3TN6MmupvU7JgIRqM1GMYr7yismap0w4fHfISE2jxQ9xcfV1QL2uHF7Wy3jr5uPXYn5LoNQjKw+PpL2ZaQGVVre3V4gBztr8loKo/Gkkg4JTsDk5yiACBMRHGLy4dS0wl stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_SIGNATURE = `-----BEGIN SSH SIGNATURE-----
U1NIU0lHAAAAAQAAARcAAAAHc3NoLXJzYQAAAAMBAAEAAAEBAMVgWqy6Lo+ksM3QDZuXIE
n9lWdMRiOeWe5GH382zYNcyjhhHISrTvwfrxD0x2DDYWBw0cV7/kd2t9PxO6lGzYhIZyka
c26m8BGP1oP3Uk0B3N7Thmys/UgKhbYms6NexTr55kslV5dmExQI4XQII0CtmWN2Tujwas
BQjxwTPLEw+1FmwrL9nr/qvhQGAH7z+gWU4mfYKW03ey/OkPFHxlVYYMCRkoJ2oqrcMpqG
6Zu/f02JKYS8VY89X17uax6ScDy8b0DNDbiyIw9nw7aRfbCXQCfAHQhweCsV9lP9cWeGJe
JWkn1x6HwCo8EBfJFfe7rQdKwTo0TuiIH3OIDysB8AAAAPZG91YmxlYmxpbmQueHl6AAAA
AAAAAAZzaGE1MTIAAAEUAAAADHJzYS1zaGEyLTUxMgAAAQAaogS/+Wp9JcG1HMOaLkVN8k
j9ijWGDnfaCykVwMT2hYXjEubcnD1/3pgAhmlYQQTdMdZTS9+7sHibB7mhWTXvQu+zvOH1
Egsc8qUSMzRcnaziZD5g5Op1j7lRRHwyYtbZHsPGTPxynopnZtYlHt4JTXDHotKYAwhFiz
0HFc7oPrHr495bwSEOiWW76HWGRu4DoWTbRJ97HEzKq08QrzM3BumCA3az65szN6v21Y4M
QjSs+w677P/43CeXxFIYoK5N/vhXeI+6FAg2oGA3rn1sFfauoOnmbQqQ85KQ2DyQsks487
jBIoOQ90WPWCEhZDTNmVkrpBft05kmbgkm/FeS
-----END SSH SIGNATURE-----`;

export const Prover: React.FC<{}> = (props) => {
  const [groupKeys, setGroupKeys] = useState([
    sshpk.parseKey(DEFAULT_PUBLIC_KEY_1, "ssh"),
    sshpk.parseKey(DEFAULT_PUBLIC_KEY_2, "ssh"),
  ]);
  const [payload1, setPayload1] = useState("Hello World");
  const [groupSignature, setGroupSignature] = useState<
    string | IGroupSignature
  >();
  const [payload2, setPayload2] = useState("");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const { value, error } = useAsync(async () => {
    const { circuitInputs, valid } = await getCircuitInputs(
      signature,
      payload1,
      payload2,
      groupKeys
    );
    return { circuitInputs, valid };
  }, [signature, payload1, payload2, groupKeys]);
  const { circuitInputs, valid } = value || {};
  if (error) console.error(error);
  return (
    <div className="App">
      <h2>Zero Knowledge RSA Group Signature Generator</h2>
      <div>
        <h3>Instructions</h3>
        1. Run the following command (see{" "}
        <a href="https://man7.org/linux/man-pages/man1/ssh-keygen.1.html">
          Man Page
        </a>{" "}
        of <code>ssh-keygen</code> for more info).
        <br />
        <pre>
          echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n
          doubleblind.xyz -f ~/.ssh/id_rsa
        </pre>
        2. Enter the signature in this page but do not share it with anyone
        else.
        <br />
      </div>
      <div className="fields">
        <div>
          <label>SSH Signature</label>
          <textarea
            style={{ height: 100 }}
            value={signature}
            onChange={(e) => {
              setSignature(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Payload 1</label>
          <input
            value={payload1}
            onChange={(e) => {
              setPayload1(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Payload 2</label>
          <input
            value={payload2}
            onChange={(e) => {
              setPayload2(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Group Public Keys</label>
          <textarea
            ref={(c) => {
              if (c)
                c.innerHTML =
                  DEFAULT_PUBLIC_KEY_1 + "\n" + DEFAULT_PUBLIC_KEY_2;
            }}
            style={{ height: 100, width: 400 }}
            onChange={(e) => {
              const lines = _.compact(e.currentTarget.value.split("\n"));
              try {
                const keys = lines.map((line: string) =>
                  sshpk.parseKey(line, "ssh")
                );
                setGroupKeys(keys);
              } catch (err) {
                setGroupKeys([]);
              }
            }}
          />
        </div>
      </div>
      <br />
      <h3>ZK Proof</h3>
      {valid && !valid.validPublicKeyGroupMembership && (
        <div>
          Warning: Provided SSH Signature does not correspond with any public
          key in the group.
        </div>
      )}
      {valid && !valid.validMessage && (
        <div>
          Warning: Provided SSH Signature does not correspond with the correct
          payload.
        </div>
      )}
      <textarea
        readOnly
        style={{ height: 200, width: "100%" }}
        value={
          groupSignature
            ? JSON.stringify(groupSignature)
            : "Click generate proof"
        }
      />

      <br />
      <button
        disabled={!circuitInputs}
        onClick={async () => {
          if (!circuitInputs) return;
          if (groupSignature === "Computing ZK Proof...") {
            return;
          }
          setGroupSignature("Computing ZK Proof...");
          try {
            (window as any).cJson = JSON.stringify(circuitInputs);
            console.log("wrote circuit input to window.cJson. Run copy(cJson)");
            const groupSignature = await generateGroupSignature(
              circuitInputs,
              groupKeys
            );
            setGroupSignature(groupSignature);
          } catch (e) {
            setGroupSignature("Error Computing ZK Proof...");
            console.error(e);
          }
        }}
      >
        Generate proof
      </button>
    </div>
  );
};
