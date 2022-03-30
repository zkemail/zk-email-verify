import React, { useRef, useState } from "react";
import Dropzone from "react-dropzone";
import { useAsync } from "react-use";
import { isGroupSignature } from "../helpers/groupSignature/types";
import { verifyGroupSignature } from "../helpers/groupSignature/verify";

export const BatchVerifier: React.FC<{}> = (props) => {
  const [groupSignatures, setGroupSignatures] = useState<object[]>([]);
  const [message, setMessage] = useState<string>();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { value: data } = useAsync(
    async () =>
      Promise.all(
        groupSignatures.map(async (sig) => {
          if (!isGroupSignature(sig)) {
            return {
              rawSig: sig,
              verified: "Failed JSON Validation; missing fields",
            };
          }

          return {
            rawSig: sig,
            verified: await verifyGroupSignature(sig),
          };
        })
      ),
    [groupSignatures]
  );
  return (
    <div className="App">
      <h2>Paste or upload a group signature json file</h2>
      <textarea
        style={{ width: 400, height: 100 }}
        ref={textAreaRef}
      ></textarea>
      <div>
        <button
          onClick={() => {
            if (!textAreaRef.current) return;
            try {
              setGroupSignatures([
                ...groupSignatures,
                JSON.parse(textAreaRef.current.value),
              ]);
              setMessage(undefined);
            } catch (e) {
              setMessage("Error: Could not parse group signature");
            }
          }}
        >
          Verify
        </button>{" "}
        <span>{message}</span>
      </div>
      <Dropzone
        accept={["csv", "json"]}
        onDrop={(acceptedFiles) => {
          console.log(acceptedFiles);
        }}
      >
        {({ getRootProps, getInputProps }) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div
                style={{
                  width: 400,
                  height: 100,
                  border: "1px dashed black",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "20px auto",
                }}
              >
                Upload File
              </div>
            </div>
          </section>
        )}
      </Dropzone>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
