// @ts-ignore
import React, { useEffect, useMemo, useState } from "react";
import { useAsync, useMount, useUpdateEffect } from "react-use";
// @ts-ignore
// @ts-ignore
import _, { add } from "lodash";
// @ts-ignore
import { generate_inputs, insert13Before10 } from "../scripts/generate_input";
import styled, { CSSProperties } from "styled-components";
import { sshSignatureToPubKey } from "../helpers/sshFormat";
import { Link, useSearchParams } from "react-router-dom";
import { dkimVerify } from "../helpers/dkim";
import atob from "atob";
import { downloadProofFiles, generateProof, verifyProof } from "../helpers/zkp";
import { packedNBytesToString } from "../helpers/binaryFormat";
import { LabeledTextArea } from "../components/LabeledTextArea";
import { SingleLineInput } from "../components/SingleLineInput";
import { Button } from "../components/Button";
import { Col, Row } from "../components/Layout";
import { NumberedStep } from "../components/NumberedStep";
import { TopBanner } from "../components/TopBanner";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { ProgressBar } from "../components/ProgressBar";
import { abi } from "../helpers/twitterEmailHandler.abi";
import { isSetIterator } from "util/types";
var Buffer = require("buffer/").Buffer; // note: the trailing slash is important!

const generate_input = require("../scripts/generate_input");

export const MainPage: React.FC<{}> = (props) => {
  // raw user inputs
  const filename = "email";

  const [emailSignals, setEmailSignals] = useState<string>("");
  const [emailFull, setEmailFull] = useState<string>(localStorage.emailFull || "");
  const [proof, setProof] = useState<string>(localStorage.proof || "");
  const [publicSignals, setPublicSignals] = useState<string>(localStorage.publicSignals || "");
  const [displayMessage, setDisplayMessage] = useState<string>("Prove");
  const [emailHeader, setEmailHeader] = useState<string>("");
  const { address } = useAccount();
  const [ethereumAddress, setEthereumAddress] = useState<string>(address ?? "");
  // computed state
  const { value, error } = useAsync(async () => {
    try {
      const circuitInputs = await generate_inputs(Buffer.from(atob(emailFull)), ethereumAddress);
      return circuitInputs;
    } catch (e) {
      return {};
    }
  }, [emailFull, ethereumAddress]);

  const circuitInputs = value || {};
  console.log("Circuit inputs:", circuitInputs);

  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationPassed, setVerificationPassed] = useState(false);
  const [lastAction, setLastAction] = useState<"" | "sign" | "verify" | "send">("");
  const [showBrowserWarning, setShowBrowserWarning] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.indexOf("Chrome") > -1;
    if (!isChrome) {
      setShowBrowserWarning(true);
    }
  }, []);

  useEffect(() => {
    if (address) {
      setEthereumAddress(address);
    } else {
      setEthereumAddress("");
    }
  }, [address]);
  const [status, setStatus] = useState<
    | "not-started"
    | "generating-input"
    | "downloading-proof-files"
    | "generating-proof"
    | "error-bad-input"
    | "error-failed-to-download"
    | "error-failed-to-prove"
    | "done"
    | "sending-on-chain"
    | "sent"
  >("not-started");
  const [zkeyStatus, setzkeyStatus] = useState<Record<string, string>>({
    a: "not started",
    b: "not started",
    c: "not started",
    d: "not started",
    e: "not started",
    f: "not started",
    g: "not started",
    h: "not started",
    i: "not started",
    k: "not started",
  });
  const [stopwatch, setStopwatch] = useState<Record<string, number>>({
    startedDownloading: 0,
    finishedDownloading: 0,
    startedProving: 0,
    finishedProving: 0,
  });

  const recordTimeForActivity = (activity: string) => {
    setStopwatch((prev) => ({
      ...prev,
      [activity]: Date.now(),
    }));
  };

  const reformatProofForChain = (proof: string) => {
    return [
      proof ? JSON.parse(proof)["pi_a"].slice(0, 2) : null,
      proof
        ? JSON.parse(proof)
            ["pi_b"].slice(0, 2)
            .map((g2point: any[]) => g2point.reverse())
        : null,
      proof ? JSON.parse(proof)["pi_c"].slice(0, 2) : null,
    ];
  };

  const { config } = usePrepareContractWrite({
    addressOrName: "0x72D9d080853f1AfA52662D71A24D92498Ef84799", // TODO: get address
    contractInterface: abi, // TODO: get abi
    functionName: "mint",
    args: [...reformatProofForChain(proof), publicSignals ? JSON.parse(publicSignals) : null],
    onError: (error: { message: any }) => {
      console.error(error.message);
      // TODO: handle errors
    },
  });

  const { data, isLoading, isSuccess, write } = useContractWrite(config);

  console.log("Other values:", proof, publicSignals, write, data, isLoading, isSuccess, config);

  useMount(() => {
    function handleKeyDown() {
      setLastAction("");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // local storage stuff
  useUpdateEffect(() => {
    if (value) {
      if (localStorage.emailFull !== emailFull) {
        console.info("Wrote email to localStorage");
        localStorage.emailFull = emailFull;
      }
    }
    if (proof) {
      if (localStorage.proof !== proof) {
        console.info("Wrote proof to localStorage");
        localStorage.proof = proof;
      }
    }
    if (publicSignals) {
      if (localStorage.publicSignals !== publicSignals) {
        console.info("Wrote publicSignals to localStorage");
        localStorage.publicSignals = publicSignals;
      }
    }
  }, [value]);

  if (error) console.error(error);

  return (
    <Container>
      {showBrowserWarning && <TopBanner message={"ZK Email only works on Chrome or Chromium-based browsers."} />}
      <div className="title">
        <Header>ZK Email Ownership Proof Generator From Header</Header>
      </div>

      <Col
        style={{
          gap: "8px",
          maxWidth: "720px",
          margin: "0 auto",
          marginBottom: "2rem",
        }}
      >
        <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Note that we are <a href="https://github.com/zk-email-verify/zk-email-verify/">actively developing</a> and debugging this page, it is likely unstable. Due to download
          limits of incognito mode and non-chrome browsers, you must use Chrome to generate proofs right now. Our goal for March 2023 is to make this process 10x faster and
          smaller. If you wish to generate a ZK proof of Twitter badge, you must do these:
        </span>
        <NumberedStep step={1}>
          Send yourself a{" "}
          <a href="https://twitter.com/i/flow/password_reset" target="_blank" rel="noreferrer">
            password reset email
          </a>{" "}
          from Twitter.
        </NumberedStep>
        <NumberedStep step={2}>
          In your inbox, find the email from Twitter and click the three dot menu, then "Show original" then "Copy to clipboard". If on Outlook, download the original email as .eml
          and copy it instead.
        </NumberedStep>
        <NumberedStep step={3}>
          Copy paste that into the box below. Note that we cannot use this to phish you: we do not know your password, and we never get this email info because we have no server at
          all. We are actively searching for a less sketchy email.
        </NumberedStep>
        <NumberedStep step={4}>
          Paste in your sending Ethereum address. This ensures that no one else can "steal" your proof for another account (frontrunning protection!).
        </NumberedStep>
        <NumberedStep step={5}>
          Click <b>"Generate Proof"</b>. Since it is completely client side and open source, and you are not trusting us with any private information.
        </NumberedStep>
        <NumberedStep step={6}>
          Click <b>"Verify"</b> and then <b>"Mint Twitter Badge On-Chain"</b>, and approve to mint the NFT badge that proves Twitter ownership! Note that it is 700K gas right now
          so only feasible on Goerli, though we intend to reduce this soon.
        </NumberedStep>
      </Col>
      <Main>
        <Column>
          <SubHeader>Input</SubHeader>
          <LabeledTextArea
            label="Full Email with Headers"
            value={emailFull}
            onChange={(e) => {
              setEmailFull(e.currentTarget.value);
            }}
          />
          <SingleLineInput
            label="Ethereum Address"
            value={ethereumAddress}
            onChange={(e) => {
              setEthereumAddress(e.currentTarget.value);
            }}
          />
          <Button
            data-testid="prove-button"
            disabled={displayMessage !== "Prove" || emailFull.length === 0 || ethereumAddress.length === 0}
            onClick={async () => {
              console.log("Generating proof...");
              setDisplayMessage("Generating proof...");
              setStatus("generating-input");
              const mail =
                "RGVsaXZlcmVkLVRvOiBiaXN3YWppdHNhbXByaXRpQGdtYWlsLmNvbQ0KUmVjZWl2ZWQ6IGJ5IDIwMDI6YTA1OjY1MTI6M2UxNTowOjA6MDowIHdpdGggU01UUCBpZCBpMjFjc3AzMTExMzI2bGZ2Ow0KICAgICAgICBXZWQsIDIwIEp1bCAyMDIyIDIwOjU1OjIwIC0wNzAwIChQRFQpDQpYLUdvb2dsZS1TbXRwLVNvdXJjZTogQUdSeU0xdVV1cmtpL0RJRHR0ckFEM1I3Z2Y4SXNWSGFXamhqaHRtKzNsSkp6RmI4SVZMdmEyUEY1YmZXTllHaDBObHRSdFJvUDJjSg0KWC1SZWNlaXZlZDogYnkgMjAwMjphMDU6NjIyYTo1MTQ6YjA6MzFmOmI1OjdkNmUgd2l0aCBTTVRQIGlkIGwyMC0yMDAyMGEwNTYyMmEwNTE0MDBiMDAzMWYwMGI1N2Q2ZW1yODI1NTQ3NHF0eC42NzcuMTY1ODM3NTcxOTgxNDsNCiAgICAgICAgV2VkLCAyMCBKdWwgMjAyMiAyMDo1NToxOSAtMDcwMCAoUERUKQ0KQVJDLVNlYWw6IGk9MTsgYT1yc2Etc2hhMjU2OyB0PTE2NTgzNzU3MTk7IGN2PW5vbmU7DQogICAgICAgIGQ9Z29vZ2xlLmNvbTsgcz1hcmMtMjAxNjA4MTY7DQogICAgICAgIGI9T2hMY1c4TFV0RDFmNGNEQTZ3Qk13MnhwMzEvMlJtQURtWU8ycEM0T09FbExFY1FQRnQxZTFhNzAwejVUWmNqMS9hDQogICAgICAgICBNajl5dGxKa2ladGg5SzlzSjRMc2x1QmRudk1YQndDbmc0R2w1b0tTWEpoNlZiUmtWUm5nZWhrZlB2L2ZyMkhNNGthQg0KICAgICAgICAgMHRaWEVMK3JGUjJLNjN1MmVTODVKbnlmYkh6a2t5eDJiMlBKWW1CUDJnN2tUbkR6SDJnOUhOK2cvekk5czlEbERMTUMNCiAgICAgICAgIEwzNnZrbGprcTI5a1V3aUVjUU5hbVRiREFNUUk2ZFlhMmtCbVMveFdKUDVrY0dOb3lMNzFSc2x3R3R3SE15dyt1NWlvDQogICAgICAgICBsdDlkWVRHbDBMWWlyelJvdlBPUXV4eVJFaTdlYlBuN1A4VytDVUpjem1ENjhnTFA1WWFUYjBwR0FIWWF0dGJyNURRSw0KICAgICAgICAgSmJBZz09DQpBUkMtTWVzc2FnZS1TaWduYXR1cmU6IGk9MTsgYT1yc2Etc2hhMjU2OyBjPXJlbGF4ZWQvcmVsYXhlZDsgZD1nb29nbGUuY29tOyBzPWFyYy0yMDE2MDgxNjsNCiAgICAgICAgaD10bzpzdWJqZWN0Om1lc3NhZ2UtaWQ6ZGF0ZTpmcm9tOm1pbWUtdmVyc2lvbjpka2ltLXNpZ25hdHVyZTsNCiAgICAgICAgYmg9VysvWkdkQjFkM0lVOHhGNkNBUGJwNENpRDlLY2VVU3hnV2lmeFhBZkYrdz07DQogICAgICAgIGI9T25jWXZINlFnUjFHeG82Y0VGNmV4ZEdzekl5YVFaeEFRWEFXbWNuOW1hWXdRQmNWZW9HTjNGNGpURUJXMjVDV3d0DQogICAgICAgICBVUHNacnlXdExhbDNmaHF1VzVDSHF5VWNNOGlTYXRnUUt3dkFJUGVaT0pZMFpuenRtbmdmZHdwTDliSUFyRlhuR2prRA0KICAgICAgICAgTkhRLzEwTUZxRG9uNzgwR2diTXNReVJHOS83U2NwMXBySUowTTFvNGlCWUtIRFBiNkJHRkg3Q3dPcWUycWE5TnNTVy8NCiAgICAgICAgIFZnTmovU3B1QlJuTDNsZlpsZnN1MC93WlVENWNjb1pJeS9IdlllRjFYczF0bG9aWENqcWtoQ1c4RzZOZmpjRzluYkZUDQogICAgICAgICBmakZJSS9XallkazZSSkRXaUt3N0p3UUF4a3hKMHhOcEpyMUZSUDFhdGRsSGFoQ1B1QWhvUUp0MFBsdGdFUi9jU1VJcQ0KICAgICAgICAgNWlkQT09DQpBUkMtQXV0aGVudGljYXRpb24tUmVzdWx0czogaT0xOyBteC5nb29nbGUuY29tOw0KICAgICAgIGRraW09cGFzcyBoZWFkZXIuaT1AbWl0LmVkdSBoZWFkZXIucz1vdXRnb2luZyBoZWFkZXIuYj1lSGNxYmRoRzsNCiAgICAgICBzcGY9cGFzcyAoZ29vZ2xlLmNvbTogZG9tYWluIG9mIGFheXVzaGdAbWl0LmVkdSBkZXNpZ25hdGVzIDE4LjkuMjguMTEgYXMgcGVybWl0dGVkIHNlbmRlcikgc210cC5tYWlsZnJvbT1hYXl1c2hnQG1pdC5lZHU7DQogICAgICAgZG1hcmM9cGFzcyAocD1OT05FIHNwPU5PTkUgZGlzPU5PTkUpIGhlYWRlci5mcm9tPW1pdC5lZHUNClJldHVybi1QYXRoOiA8YWF5dXNoZ0BtaXQuZWR1Pg0KUmVjZWl2ZWQ6IGZyb20gb3V0Z29pbmcubWl0LmVkdSAob3V0Z29pbmctYXV0aC0xLm1pdC5lZHUuIFsxOC45LjI4LjExXSkNCiAgICAgICAgYnkgbXguZ29vZ2xlLmNvbSB3aXRoIEVTTVRQUyBpZCBhMTgtMjAwMjBhYzg0NGIyMDAwMDAwYjAwMzFlZGY0NjZiNzNzaTQ2NjAxN3F0by42NC4yMDIyLjA3LjIwLjIwLjU1LjE5DQogICAgICAgIGZvciA8Ymlzd2FqaXRzYW1wcml0aUBnbWFpbC5jb20+DQogICAgICAgICh2ZXJzaW9uPVRMUzFfMiBjaXBoZXI9RUNESEUtRUNEU0EtQUVTMTI4LUdDTS1TSEEyNTYgYml0cz0xMjgvMTI4KTsNCiAgICAgICAgV2VkLCAyMCBKdWwgMjAyMiAyMDo1NToxOSAtMDcwMCAoUERUKQ0KUmVjZWl2ZWQtU1BGOiBwYXNzIChnb29nbGUuY29tOiBkb21haW4gb2YgYWF5dXNoZ0BtaXQuZWR1IGRlc2lnbmF0ZXMgMTguOS4yOC4xMSBhcyBwZXJtaXR0ZWQgc2VuZGVyKSBjbGllbnQtaXA9MTguOS4yOC4xMTsNCkF1dGhlbnRpY2F0aW9uLVJlc3VsdHM6IG14Lmdvb2dsZS5jb207DQogICAgICAgZGtpbT1wYXNzIGhlYWRlci5pPUBtaXQuZWR1IGhlYWRlci5zPW91dGdvaW5nIGhlYWRlci5iPWVIY3FiZGhHOw0KICAgICAgIHNwZj1wYXNzIChnb29nbGUuY29tOiBkb21haW4gb2YgYWF5dXNoZ0BtaXQuZWR1IGRlc2lnbmF0ZXMgMTguOS4yOC4xMSBhcyBwZXJtaXR0ZWQgc2VuZGVyKSBzbXRwLm1haWxmcm9tPWFheXVzaGdAbWl0LmVkdTsNCiAgICAgICBkbWFyYz1wYXNzIChwPU5PTkUgc3A9Tk9ORSBkaXM9Tk9ORSkgaGVhZGVyLmZyb209bWl0LmVkdQ0KUmVjZWl2ZWQ6IGZyb20gbWFpbC15dzEtZjE4Mi5nb29nbGUuY29tIChtYWlsLXl3MS1mMTgyLmdvb2dsZS5jb20gWzIwOS44NS4xMjguMTgyXSkNCgkoYXV0aGVudGljYXRlZCBiaXRzPTApDQogICAgICAgIChVc2VyIGF1dGhlbnRpY2F0ZWQgYXMgYWF5dXNoZ0BBVEhFTkEuTUlULkVEVSkNCglieSBvdXRnb2luZy5taXQuZWR1ICg4LjE0LjcvOC4xMi40KSB3aXRoIEVTTVRQIGlkIDI2TDN0STdPMDA4NTM0DQoJKHZlcnNpb249VExTdjEvU1NMdjMgY2lwaGVyPUFFUzEyOC1HQ00tU0hBMjU2IGJpdHM9MTI4IHZlcmlmeT1OT1QpDQoJZm9yIDxiaXN3YWppdHNhbXByaXRpQGdtYWlsLmNvbT47IFdlZCwgMjAgSnVsIDIwMjIgMjM6NTU6MTkgLTA0MDANCkRLSU0tU2lnbmF0dXJlOiB2PTE7IGE9cnNhLXNoYTI1NjsgYz1yZWxheGVkL3JlbGF4ZWQ7IGQ9bWl0LmVkdTsgcz1vdXRnb2luZzsNCgl0PTE2NTgzNzU3MTk7IGJoPVcrL1pHZEIxZDNJVTh4RjZDQVBicDRDaUQ5S2NlVVN4Z1dpZnhYQWZGK3c9Ow0KCWg9RnJvbTpEYXRlOlN1YmplY3Q6VG87DQoJYj1lSGNxYmRoR29GNVM4N2YrOXIvWFB0dDVEYmdCandnb1lUcytKTVBIcUFIZ2hzazhLVVRoQTFyZkhab2hvTENVUQ0KCSBxamVEbW1rQXg0aDdKeS9ldG1nemdJSGEwZmhVRHpmbDh6Y1NZUVNDU29zM0NRTERieVlkYzNVMjJyWW0xcVhmVE4NCgkgYzRsYlhJMVQvbit0b25tcnkyMG8wZ2I1YlhMVGZVWjZTblc5RitXSGhhUFBYY0pvK3cyNzREeExoL2tJcjRTaEJNDQoJIC80Qk16MHNOaXVHeGQrZzFyR3lsclAvcjVnTTRxeHl6SlRVZjA4UVljeCtEUURVc3o3dlpVUXZLUjVJV3dSSit6TA0KCSBCZjY5cElwckZuakIzeXk1MWVxeGpIZXFnWDFWeE5GVlV0S2FoZm5VTys0dTRWVGRBQzk1MU5rRDFLRzRzb0NHWVgNCgkgYmFIMnR6Ny96QXZnQT09DQpSZWNlaXZlZDogYnkgbWFpbC15dzEtZjE4Mi5nb29nbGUuY29tIHdpdGggU01UUCBpZCAwMDcyMTE1N2FlNjgyLTMxZTQ1NTI3ZGE1c280OTg5NTU3YjMuNQ0KICAgICAgICBmb3IgPGJpc3dhaml0c2FtcHJpdGlAZ21haWwuY29tPjsgV2VkLCAyMCBKdWwgMjAyMiAyMDo1NToxOCAtMDcwMCAoUERUKQ0KWC1HbS1NZXNzYWdlLVN0YXRlOiBBSklvcmE4aXlsUmVNZmU2RWxSL0hHL3AvTXFDcGhJVGNEL2hvYkpXS0ZZU3hWQVVOMHYycmIzbg0KCUMwc2s0dkdlcmlVUklNbkdxWCsrdUhMcFZzNHlPY3pscGFLZ3FIdz0NClgtUmVjZWl2ZWQ6IGJ5IDIwMDI6YTBkOmY2YzU6MDpiMDozMWQ6YWY3ZDo1ZDRmIHdpdGggU01UUCBpZA0KIGcxODgtMjAwMjBhMGRmNmM1MDAwMDAwYjAwMzFkYWY3ZDVkNGZtcjQ0MjU4MTI2eXdmLjE4Ny4xNjU4Mzc1NzE4MDA3OyBXZWQsIDIwDQogSnVsIDIwMjIgMjA6NTU6MTggLTA3MDAgKFBEVCkNCk1JTUUtVmVyc2lvbjogMS4wDQpGcm9tOiBBYXl1c2ggR3VwdGEgPGFheXVzaGdAbWl0LmVkdT4NCkRhdGU6IFdlZCwgMjAgSnVsIDIwMjIgMjM6NTU6MDYgLTA0MDANClgtR21haWwtT3JpZ2luYWwtTWVzc2FnZS1JRDogPENBK09KNVFmRU9NN0VFYlV6MCsya1cwdXQ2b0RaVDZ0c0J5N3BUazZEZ3pBTlQtTGROd0BtYWlsLmdtYWlsLmNvbT4NCk1lc3NhZ2UtSUQ6IDxDQStPSjVRZkVPTTdFRWJVejArMmtXMHV0Nm9EWlQ2dHNCeTdwVGs2RGd6QU5ULUxkTndAbWFpbC5nbWFpbC5jb20+DQpTdWJqZWN0OiBkZXNwZXJhdGVseSB0cnlpbmcgdG8gbWFrZSBpdCB0byBjaGFpbg0KVG86ICJiaXN3YWppdHNhbXByaXRpQGdtYWlsLmNvbSIgPGJpc3dhaml0c2FtcHJpdGlAZ21haWwuY29tPg0KQ29udGVudC1UeXBlOiBtdWx0aXBhcnQvYWx0ZXJuYXRpdmU7IGJvdW5kYXJ5PSIwMDAwMDAwMDAwMDA5Mzc3YWYwNWU0NDhhZjUxIg0KDQotLTAwMDAwMDAwMDAwMDkzNzdhZjA1ZTQ0OGFmNTENCkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbjsgY2hhcnNldD0iVVRGLTgiDQoNCndpbGwgd2UgbWFrZSBpdCB0aGlzIHRpbWUgaW50byB0aGUgemsgcHJvb2YNCg0KLS0wMDAwMDAwMDAwMDA5Mzc3YWYwNWU0NDhhZjUxDQpDb250ZW50LVR5cGU6IHRleHQvaHRtbDsgY2hhcnNldD0iVVRGLTgiDQoNCjxkaXYgZGlyPSJhdXRvIj53aWxsIHdlIG1ha2UgaXQgdGhpcyB0aW1lIGludG8gdGhlIHprIHByb29mPC9kaXY+DQoNCi0tMDAwMDAwMDAwMDAwOTM3N2FmMDVlNDQ4YWY1MS0tDQo=";

              const formattedArray = await insert13Before10(Uint8Array.from(Buffer.from(emailFull)));
              // Due to a quirk in carriage return parsing in JS, we need to manually edit carriage returns to match DKIM parsing
              console.log("formattedArray", formattedArray);
              console.log("buffFormArray", Buffer.from(formattedArray.buffer));
              console.log("buffFormArray", formattedArray.toString());
              console.log("ethereumAddress", ethereumAddress);
              let input = "";
              try {
                input = await generate_input.generate_inputs(Buffer.from(formattedArray.buffer), ethereumAddress);
              } catch (e) {
                console.log("Error generating input", e);
                setDisplayMessage("Prove");
                setStatus("error-bad-input");
                return;
              }
              console.log("Generated input:", JSON.stringify(input));

              // Insert input structuring code here
              // const input = buildInput(pubkey, msghash, sig);
              // console.log(JSON.stringify(input, (k, v) => (typeof v == "bigint" ? v.toString() : v), 2));

              console.time("zk-dl");
              recordTimeForActivity("startedDownloading");
              setDisplayMessage("Downloading compressed proving files... (this may take a few minutes)");
              setStatus("downloading-proof-files");
              await downloadProofFiles(filename, () => {
                setDownloadProgress((p) => p + 1);
              });
              console.timeEnd("zk-dl");
              recordTimeForActivity("finishedDownloading");

              console.time("zk-gen");
              recordTimeForActivity("startedProving");
              setDisplayMessage("Starting proof generation... (this will take 6-10 minutes and ~5GB RAM)");
              setStatus("generating-proof");
              console.log("Starting proof generation");
              // alert("Generating proof, will fail due to input");
              const { proof, publicSignals } = await generateProof(input, filename);
              //const proof = JSON.parse('{"pi_a": ["19201501460375869359786976350200749752225831881815567077814357716475109214225", "11505143118120261821370828666956392917988845645366364291926723724764197308214", "1"], "pi_b": [["17114997753466635923095897108905313066875545082621248342234075865495571603410", "7192405994185710518536526038522451195158265656066550519902313122056350381280"], ["13696222194662648890012762427265603087145644894565446235939768763001479304886", "2757027655603295785352548686090997179551660115030413843642436323047552012712"], ["1", "0"]], "pi_c": ["6168386124525054064559735110298802977718009746891233616490776755671099515304", "11077116868070103472532367637450067545191977757024528865783681032080180232316", "1"], "protocol": "groth16", "curve": "bn128"}');
              //const publicSignals = JSON.parse('["0", "0", "0", "0", "0", "0", "0", "0", "32767059066617856", "30803244233155956", "0", "0", "0", "0", "27917065853693287", "28015", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "113659471951225", "0", "0", "1634582323953821262989958727173988295", "1938094444722442142315201757874145583", "375300260153333632727697921604599470", "1369658125109277828425429339149824874", "1589384595547333389911397650751436647", "1428144289938431173655248321840778928", "1919508490085653366961918211405731923", "2358009612379481320362782200045159837", "518833500408858308962881361452944175", "1163210548821508924802510293967109414", "1361351910698751746280135795885107181", "1445969488612593115566934629427756345", "2457340995040159831545380614838948388", "2612807374136932899648418365680887439", "16021263889082005631675788949457422", "299744519975649772895460843780023483", "3933359104846508935112096715593287", "556307310756571904145052207427031380052712977221"]');
              console.log("Finished proof generation");
              console.timeEnd("zk-gen");
              recordTimeForActivity("finishedProving");

              // alert("Done generating proof");
              setProof(JSON.stringify(proof));
              let kek = publicSignals.map((x: string) => BigInt(x));
              let soln = packedNBytesToString(kek.slice(0, 12));
              let soln2 = packedNBytesToString(kek.slice(12, 147));
              let soln3 = packedNBytesToString(kek.slice(147, 150));
              // setPublicSignals(`From: ${soln}\nTo: ${soln2}\nUsername: ${soln3}`);
              setPublicSignals(JSON.stringify(publicSignals));

              if (!circuitInputs) {
                setStatus("error-failed-to-prove");
                return;
              }
              setLastAction("sign");
              setDisplayMessage("Finished computing ZK proof");
              setStatus("done");
              try {
                (window as any).cJson = JSON.stringify(circuitInputs);
                console.log("wrote circuit input to window.cJson. Run copy(cJson)");
              } catch (e) {
                console.error(e);
              }
            }}
          >
            {displayMessage}
          </Button>
          {displayMessage === "Downloading compressed proving files... (this may take a few minutes)" && (
            <ProgressBar width={downloadProgress * 10} label={`${downloadProgress} / 10 items`} />
          )}
          <ProcessStatus status={status}>
            {status !== "not-started" ? (
              <div>
                Status:
                <span data-testid={"status-" + status}>{status}</span>
              </div>
            ) : (
              <div data-testid={"status-" + status}></div>
            )}
            <TimerDisplay timers={stopwatch} />
          </ProcessStatus>
        </Column>
        <Column>
          <SubHeader>Output</SubHeader>
          <LabeledTextArea
            label="Proof Output"
            value={proof}
            onChange={(e) => {
              setProof(e.currentTarget.value);
            }}
            warning={verificationMessage}
            warningColor={verificationPassed ? "green" : "red"}
          />
          <LabeledTextArea
            label="..."
            value={publicSignals}
            secret
            onChange={(e) => {
              setPublicSignals(e.currentTarget.value);
            }}
            // warning={
            // }
          />
          <Button
            disabled={emailFull.trim().length === 0 || proof.length === 0}
            onClick={async () => {
              try {
                setLastAction("verify");
                let ok = true;
                const res: boolean = await verifyProof(JSON.parse(proof), JSON.parse(publicSignals));
                console.log(res);
                if (!res) throw Error("Verification failed!");
                setVerificationMessage("Passed!");
                setVerificationPassed(ok);
              } catch (er: any) {
                setVerificationMessage("Failed to verify " + er.toString());
                setVerificationPassed(false);
              }
            }}
          >
            Verify
          </Button>
          <Button
            disabled={!verificationPassed || isLoading || isSuccess}
            onClick={async () => {
              setStatus("sending-on-chain");
              write?.();
            }}
          >
            {isSuccess
              ? "Successfully sent to chain!"
              : isLoading
              ? "Confirm in wallet"
              : verificationPassed
              ? "Mint Twitter badge on-chain"
              : "Verify first, before minting on-chain!"}
          </Button>
          {isSuccess && (
            <div>
              Transaction: <a href={"https://goerli.etherscan.io/tx/" + data?.hash}>{data?.hash}</a>
            </div>
          )}
        </Column>
      </Main>
    </Container>
  );
};

const ProcessStatus = styled.div<{ status: string }>`
  font-size: 8px;
  padding: 8px;
  border-radius: 8px;
`;

const TimerDisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 8px;
`;

const TimerDisplay = ({ timers }: { timers: Record<string, number> }) => {
  return (
    <TimerDisplayContainer>
      {timers["startedDownloading"] && timers["finishedDownloading"] ? (
        <div>
          Zkey Download time:&nbsp;
          <span data-testid="download-time">{timers["finishedDownloading"] - timers["startedDownloading"]}</span>ms
        </div>
      ) : (
        <div></div>
      )}
      {timers["startedProving"] && timers["finishedProving"] ? (
        <div>
          Proof generation time:&nbsp;
          <span data-testid="proof-time">{timers["finishedProving"] - timers["startedProving"]}</span>ms
        </div>
      ) : (
        <div></div>
      )}
    </TimerDisplayContainer>
  );
};

const Header = styled.span`
  font-weight: 600;
  margin-bottom: 1em;
  color: #fff;
  font-size: 2.25rem;
  line-height: 2.5rem;
  letter-spacing: -0.02em;
`;

const SubHeader = styled(Header)`
  font-size: 1.7em;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.9);
`;

const Main = styled(Row)`
  width: 100%;
  gap: 1rem;
`;

const Column = styled(Col)`
  width: 100%;
  gap: 1rem;
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  & .title {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  & .main {
    & .signaturePane {
      flex: 1;
      display: flex;
      flex-direction: column;
      & > :first-child {
        height: calc(30vh + 24px);
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
