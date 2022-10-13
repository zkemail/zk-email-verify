import styled from "styled-components";
import Dropzone from "react-dropzone";
import { shaHash } from "../helpers/shaHash";
import { useState } from "react";
import { toHex } from "../helpers/binaryFormat";
import localforage from "localforage";
import { useAsync } from "react-use";

export const SetupPage: React.FC = () => {
  const [status, setStatus] = useState<string>("Please upload a file.");
  const setupCompleted = useAsync(async () => {
    const item = await localforage.getItem("rsa_group_sig_verify_0000.zkey");
    return !!item;
  }, [status]);
  return (
    <Container>
      <h1>ZK Email Setup</h1>
      <p>
        There is no extra setup required. Ignore the following box.
      </p>
      <Dropzone
        // accept={"zkey"}
        onDrop={(acceptedFiles) => {
          console.log(acceptedFiles);

          const reader = new FileReader();

          reader.onabort = () => console.log("file reading was aborted");
          reader.onerror = () => console.log("file reading has failed");
          reader.onload = async () => {
            const item = await localforage.getItem(
              "rsa_group_sig_verify_0000.zkey"
            );
            if (item) {
              setStatus(
                "Error: zkey file already exists. Please return to the main page."
              );
              return;
            }

            // Do whatever you want with the file contents
            const binaryStr = reader.result;
            if (!binaryStr || !(binaryStr instanceof ArrayBuffer)) {
              setStatus("Could not read uploaded file.");
              return;
            }
            console.log(binaryStr);
            setStatus("Verifying SHASUM...");
            const hash = await shaHash(new Uint8Array(binaryStr));
            const hashHex = toHex(hash);
            const expectedHex =
              "2c7174a706452a1d2ded3119dc6394979079148e708135aa763884f2a7f515b242730e03784620b30acbd1c41237b5582702a54224109bd28d8222252cff69af";
            if (hashHex === expectedHex) {
              setStatus(
                "Verification successful. Writing to IndexedDB (browser storage)..."
              );
              try {
                await localforage.setItem(
                  "rsa_group_sig_verify_0000.zkey",
                  binaryStr
                );
                setStatus(
                  "Verification successful. Storage successful. You may now return to the main page of the app."
                );
              } catch (e) {
                setStatus(
                  "Verification successful. Storage unsucessful. Please check that IndexedDB is enabled in your browser."
                );
              }
            } else {
              setStatus(
                "Failed to verify SHASUM. Pick a different a file and try again. See console for details"
              );
              console.error(
                `shasum -a 512 rsa_group_sig_verify_0000.zkey\n Got ${hashHex}\n Expected ${expectedHex}`
              );
            }
          };
          reader.readAsArrayBuffer(acceptedFiles[0]);
        }}
      >
        {({ getRootProps, getInputProps }) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <div
                style={{
                  width: 400,
                  height: 200,
                  border: "1px dashed black",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "20px auto",
                  textAlign: "center",
                }}
              >
                {status}
              </div>
            </div>
          </section>
        )}
      </Dropzone>
      {setupCompleted.value && (
        <>
          You have completed setup! Please return to the main app to begin
          creating ZK Email Signatures.
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  p {
    width: 50vw;
  }
`;
