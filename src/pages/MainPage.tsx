// @ts-ignore
import React, { useMemo, useState } from "react";
import { useAsync, useMount, useUpdateEffect } from "react-use";
// @ts-ignore
// @ts-ignore
import _ from "lodash";
// @ts-ignore
import { generate_inputs, insert13Before10 } from "../scripts/generate_input";
import styled, { CSSProperties } from "styled-components";
import { sshSignatureToPubKey } from "../helpers/sshFormat";
import { Link, useSearchParams } from "react-router-dom";
import localforage from "localforage";
import { dkimVerify } from "../helpers/dkim";
import atob from "atob";
import { downloadProofFiles, generateProof, verifyProof, buildInput, downloadFromFilename } from "../helpers/zkp";
import { packedNBytesToString } from "../helpers/binaryFormat";
import { Profile } from "./WalletProfile";
var Buffer = require("buffer/").Buffer; // note: the trailing slash is important!

const generate_input = require("../scripts/generate_input");
const demoUrl =
  "/?message=I%20like%20cats&group_name=https%3A%2F%2Fgithub.com%2Forgs%2Fdoubleblind-xyz%2Fpeople&group_members=ssh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQCq8ZasN4NVES99%2B9XRhFLkuT4deiyen01D5nWt8%2FBoqdcCW0jH%2FLLiew%2FxVQ7%2FmMYmEg%2Fw6In8kUMJTCd7oXBDYHNBGxhuIqKEDh15yN5loQykW8YCA74m8V6fdnZ22krFGS%2FnixYr19xEJ2cY28Jq8QNO03421T4QiZsqB8LcMOfMvVPzU96UWHR16LW1Lgj7pGLwbP%2FDBQRWn%2BAlaSYi%2FyHgCit9GgqOf2O7JqQ01p7d9AlBHyTPfDJHJOosKMKiwNwP4Rwyir%2FKeRde65v%2FMqRnBWoQogjTNAylyCMOUDhNZQbiF8ttIynY2xtg5i52Qc9qY%2FBZAk1J%2FSK8MjEae4o8JU%2BfwBGH4aXDLx5AGwD5EHm95M2WiEu8kvcGv%2BbnPp4OED8W2pvoI8Q0PmYJ8WC6vebM4fOg9dnvZ52jUb5mpfWmUy0%2FPeOPyxsfTjpptirNhJUpWWdhDfPNxT19jSka4BYlhHEVXeR1%2BepBXe7z1m0w4RMVFHyDvsr1gUlcWjO9ufccdqNnNjrWcKLIm455RJivh8V1JC%2F2mJdMrYGKf54%2FOXa%2BEMcRpgKO1kjhqDCMitA8IVa8bcVFcvwmB1myoondETeO7bdGIVBMV1o8H%2BU6GL29p%2B5nKzKWUN1IRPgIuMS80sq7MDBkKChzQxJHE%2FhhkszQvAgR9OdzjQ%3D%3D%20scott%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAABAQCqu5UxDsmcu7ibKB20ucaYyEsk1EDAa5uXfyDJiH30x4t%2FXwS7b7qdegO1HlvfE1HA7iPqjtbWj70qwDFJwwGazxze33J1oh%2FLMKfPUzZ32y8tRU0JHR9nHZHMOcoUYPNeXLVDh6jdEX3%2B2%2FodIbSVbu54wUF5j6q7iAv%2B6Ch9qcMaO9vPEt3z6QX5LnUAqvCwu5sUgobWB7I10iGD4jFYDL%2Ff22pOGK%2BKyW26vkMh%2Fcg8FNC07ilRiYqQIxfdj7lWaYbO0VhxhQtTH5HcgQ2bAWZ6Rp9%2FcXOAegboV2dxjQ%2FuIumcdaqkXeHNypC3j%2F6%2BTBi5BFMQit8gy1H9R86x%20scott%0A%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAABAQDRvpOL7TZcYtHsSSz4lj8vTyIEuFSQnUqHTxhhsEWzAbq9LHMqYm4Whg1oRm430QvJF5xfOaLk%2BbmO6hN1g4Y9yJUj4uhaNSfSl3wGLBxu5OQNngnIDCbxTLjat4Jgz79ZiAo79c6bVq13xcfG0fjtFoC3FbZD0VEmqmwd%2FlYCLLVqtjccQur8B56O9Pj%2FgiDMby0iQPFEe9vlpP8Wg3WVjFRQkwNOhGzvLNrlOBkJXpG9xty43O9T09qHJzKYobrAnlKeRTqYqppVfwmYI7rqr2rqTXF9mBB4s1zUCXJzTVrnqexzeH%2BUv54KIaXxR2CAn3%2BDDtDBfJ4wqk%2F8OBNN%20andrew%0A%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQDcJSRy%2BRXANfCgJpzhX9fWEnslgCcgffw5t2mWW5Ltc2cfiWr1w3dUGoSa6oNs1QTwYkdfvy9cv1zwG%2B77a1AhtmjwywahSuOE3yg1IIe6Qo4U7Ae%2B7r8F08Qob7Ct8ZoUHPupbFYyXF759xYpN%2Bvvjuy3MbgTwnbijqH2HUAIwBT2V%2FxbGuwVBNK80i9ib3DNchW%2FwYu9oSukXufzBpPYBZUzAcejCTjPuv3ts%2FL%2BVPJSgaiHeZ%2FqlzU01BQ37dbEieDI6k64IKNppW2l%2BC0ERGtsKjPSINC%2Bx%2BOvS7puOtI%2BAu%2Bp72soaBIrfONsL3oTUgtj82bRzVALCM1Dxh%2BK7O0i00H%2F5xICB4%2Bb%2FGRgho%2BF4IlDf2mDy9qMoyNA8vemH%2FLC9Rc%2BujzIJJHD9WL8nDvg2v8lQGtWDrSlwjRKlp7MtVad%2BCOF6K9oCXjhFWUVirvG%2F1cG%2FYnmzn9%2F2ZEdsYuqL6TEflxtuIM2YdJWIubgnINs3l8P8UwuNa%2FUoM4leBT05LP%2BxbD7%2BHWSXNuWK9%2B7d3t03qOoGdfsbonk9wolM5l04QlTI%2BlOmQObBxHBT7CH4cwWC%2FevovPK9jKkAk%2FAC68YTWAV1U43O9gKmtq67TsShJ9YOeZU6xAp7kAcFVjpABz6suhQa6vGrGCKO8ERp4rLV9KUrgJin86KzQ%3D%3D%20steven%0Assh-rsa%20AAAAB3NzaC1yc2EAAAADAQABAAACAQDBN%2BISLXgsf3xxG18ZSKAwARj%2F0mw0x8JGQoWuCcDB5C99bgC5CMIsm%2F7ZYHye6BdB7GbY3RV%2FaVuLzm2lh2Q9opPT2AJhWDdeYyLhrIRsexNfnUXZsETxI4M7P5mZXNHAVASG%2FQ%2Fgu2lb1aPt5oOiRCI7tvitKLOGrUtb0%2FKToaityX2OJFmEnmH%2BRM6t2ICwmfObterWjzm%2BJ5k1ydFjSSwkx669U%2FGWVf56Rruburz%2FXlDwUm9liVef5iTOH8%2FrSu82ejamZXoYJFCaSq3nCZRw8mb6xs%2BzoiYcKiGozlhg6Zbpkexr4i20vPR5d9rQItaZ38cmbk2HwZzpaqUx%2Ft055CpmUQ2N%2Fvfvzr3rUCeG0SkWsew0m8UDB0AU6LYKCQS50kr0KBYEtE%2Blt46iLf%2B5XrlBhFj99xqx5qOeSY9Pz8xuu3Ti2ckDKhyMTj9uONSBPVOxRslX8PK35L0lQdM8TOjKBpVAWx4Fyag93QWyPFdUD4kB%2BHHSo9FgC9vZxtoxPOpTf8GgIzspGVHL%2BMjW7QmBs%2BcD48K9k6XMmaSq1AEx1JjeysoO5d9bzTygyHAhyZtZftnaTQ6r8OjUGL%2BU9J16Ezp1CwxY8tHpIyh2e6HUuVE8CNkeKLf6j2VIgdQd7b%2BiSPtr3bc43tMYRW9576Qov%2Ft8pP8gEla83w%3D%3D%20steven";

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
  secret?: boolean;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}> = ({ style, warning, warningColor, disabled, disabledReason, label, value, onChange, link, className, secret }) => {
  return (
    <LabeledTextAreaContainer className={_.compact(["labeledTextAreaContainer", className]).join(" ")}>
      <label>
        {label}
        {link && (
          <a style={{ color: "gray", marginLeft: 12 }} rel="noreferrer" target="_blank" href={link}>
            Share Link
          </a>
        )}
      </label>
      {warning && (
        <span className="warning" style={{ color: warningColor }}>
          {warning}
        </span>
      )}
      <textarea style={style} title={disabled ? disabledReason : ""} disabled={disabled} value={value} onChange={onChange} />

      {secret && <div className="secret">Hover to reveal public info sent to chain</div>}
    </LabeledTextAreaContainer>
  );
};

// function decodeSearchParams(urlSearchParams: URLSearchParams): {
//   message?: string;
//   ethereum_address?: string;
// } {
//   const searchParams: {
//     message?: string;
//     ethereum_address?: string;
//   } = Object.fromEntries(urlSearchParams.entries());
//   return {
//     message: searchParams.message && decodeURIComponent(searchParams.message),
//     ethereum_address:
//       searchParams.ethereum_address && decodeURIComponent(searchParams.ethereum_address),
//   };
// }

function encodeMessageSearchParams(message: string): string {
  const parts = _.compact([message && "message=" + encodeURIComponent(message)]);
  return parts.join("&");
}

export const MainPage: React.FC<{}> = (props) => {
  // raw user inputs
  const filename = "email";

  const [emailSignals, setEmailSignals] = useState<string>("");
  const [emailFull, setEmailFull] = useState<string>(localStorage.emailFull || "");
  const [proof, setProof] = useState<string>("");
  const [publicSignals, setPublicSignals] = useState<string>("");
  const [displayMessage, setDisplayMessage] = useState<string>("Prove");
  const [emailHeader, setEmailHeader] = useState<string>("");
  const [ethereumAddress, setEthereumAddress] = useState<string>("");

  const messageShareLink = useMemo(() => {
    return window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + encodeMessageSearchParams(ethereumAddress);
  }, [ethereumAddress]);
  console.log(messageShareLink, messageShareLink.length);

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
    if (value) {
      if (localStorage.emailFull !== emailFull) {
        console.info("Wrote email to localStorage");
        localStorage.emailFull = emailFull;
      }
    }
  }, [value]);
  if (error) console.error(error);
  return (
    <Container>
      <div className="title">
        <h1>ZK Email Ownership Proof Generator From Header</h1>
        <div>
          <Link to={"/"}>Reset</Link> | <Link to={demoUrl}>Demo</Link>{" "}
        </div>
        <Profile />
      </div>
      <div className="main">
        <div className="messagePane">
          <LabeledTextArea
            label="Full Email with Headers"
            value={emailFull}
            link={messageShareLink}
            onChange={(e) => {
              setEmailFull(e.currentTarget.value);
            }}
          />
          <LabeledTextArea
            label="Ethereum Address"
            value={ethereumAddress}
            onChange={(e) => {
              setEthereumAddress(e.currentTarget.value);
            }}
          />
        </div>
        <div className="buttonsPane">
          <button
            disabled={displayMessage !== "Prove"}
            onClick={async () => {
              console.log("Generating proof...");
              const mail =
                "RGVsaXZlcmVkLVRvOiBiaXN3YWppdHNhbXByaXRpQGdtYWlsLmNvbQ0KUmVjZWl2ZWQ6IGJ5IDIwMDI6YTA1OjY1MTI6M2UxNTowOjA6MDowIHdpdGggU01UUCBpZCBpMjFjc3AzMTExMzI2bGZ2Ow0KICAgICAgICBXZWQsIDIwIEp1bCAyMDIyIDIwOjU1OjIwIC0wNzAwIChQRFQpDQpYLUdvb2dsZS1TbXRwLVNvdXJjZTogQUdSeU0xdVV1cmtpL0RJRHR0ckFEM1I3Z2Y4SXNWSGFXamhqaHRtKzNsSkp6RmI4SVZMdmEyUEY1YmZXTllHaDBObHRSdFJvUDJjSg0KWC1SZWNlaXZlZDogYnkgMjAwMjphMDU6NjIyYTo1MTQ6YjA6MzFmOmI1OjdkNmUgd2l0aCBTTVRQIGlkIGwyMC0yMDAyMGEwNTYyMmEwNTE0MDBiMDAzMWYwMGI1N2Q2ZW1yODI1NTQ3NHF0eC42NzcuMTY1ODM3NTcxOTgxNDsNCiAgICAgICAgV2VkLCAyMCBKdWwgMjAyMiAyMDo1NToxOSAtMDcwMCAoUERUKQ0KQVJDLVNlYWw6IGk9MTsgYT1yc2Etc2hhMjU2OyB0PTE2NTgzNzU3MTk7IGN2PW5vbmU7DQogICAgICAgIGQ9Z29vZ2xlLmNvbTsgcz1hcmMtMjAxNjA4MTY7DQogICAgICAgIGI9T2hMY1c4TFV0RDFmNGNEQTZ3Qk13MnhwMzEvMlJtQURtWU8ycEM0T09FbExFY1FQRnQxZTFhNzAwejVUWmNqMS9hDQogICAgICAgICBNajl5dGxKa2ladGg5SzlzSjRMc2x1QmRudk1YQndDbmc0R2w1b0tTWEpoNlZiUmtWUm5nZWhrZlB2L2ZyMkhNNGthQg0KICAgICAgICAgMHRaWEVMK3JGUjJLNjN1MmVTODVKbnlmYkh6a2t5eDJiMlBKWW1CUDJnN2tUbkR6SDJnOUhOK2cvekk5czlEbERMTUMNCiAgICAgICAgIEwzNnZrbGprcTI5a1V3aUVjUU5hbVRiREFNUUk2ZFlhMmtCbVMveFdKUDVrY0dOb3lMNzFSc2x3R3R3SE15dyt1NWlvDQogICAgICAgICBsdDlkWVRHbDBMWWlyelJvdlBPUXV4eVJFaTdlYlBuN1A4VytDVUpjem1ENjhnTFA1WWFUYjBwR0FIWWF0dGJyNURRSw0KICAgICAgICAgSmJBZz09DQpBUkMtTWVzc2FnZS1TaWduYXR1cmU6IGk9MTsgYT1yc2Etc2hhMjU2OyBjPXJlbGF4ZWQvcmVsYXhlZDsgZD1nb29nbGUuY29tOyBzPWFyYy0yMDE2MDgxNjsNCiAgICAgICAgaD10bzpzdWJqZWN0Om1lc3NhZ2UtaWQ6ZGF0ZTpmcm9tOm1pbWUtdmVyc2lvbjpka2ltLXNpZ25hdHVyZTsNCiAgICAgICAgYmg9VysvWkdkQjFkM0lVOHhGNkNBUGJwNENpRDlLY2VVU3hnV2lmeFhBZkYrdz07DQogICAgICAgIGI9T25jWXZINlFnUjFHeG82Y0VGNmV4ZEdzekl5YVFaeEFRWEFXbWNuOW1hWXdRQmNWZW9HTjNGNGpURUJXMjVDV3d0DQogICAgICAgICBVUHNacnlXdExhbDNmaHF1VzVDSHF5VWNNOGlTYXRnUUt3dkFJUGVaT0pZMFpuenRtbmdmZHdwTDliSUFyRlhuR2prRA0KICAgICAgICAgTkhRLzEwTUZxRG9uNzgwR2diTXNReVJHOS83U2NwMXBySUowTTFvNGlCWUtIRFBiNkJHRkg3Q3dPcWUycWE5TnNTVy8NCiAgICAgICAgIFZnTmovU3B1QlJuTDNsZlpsZnN1MC93WlVENWNjb1pJeS9IdlllRjFYczF0bG9aWENqcWtoQ1c4RzZOZmpjRzluYkZUDQogICAgICAgICBmakZJSS9XallkazZSSkRXaUt3N0p3UUF4a3hKMHhOcEpyMUZSUDFhdGRsSGFoQ1B1QWhvUUp0MFBsdGdFUi9jU1VJcQ0KICAgICAgICAgNWlkQT09DQpBUkMtQXV0aGVudGljYXRpb24tUmVzdWx0czogaT0xOyBteC5nb29nbGUuY29tOw0KICAgICAgIGRraW09cGFzcyBoZWFkZXIuaT1AbWl0LmVkdSBoZWFkZXIucz1vdXRnb2luZyBoZWFkZXIuYj1lSGNxYmRoRzsNCiAgICAgICBzcGY9cGFzcyAoZ29vZ2xlLmNvbTogZG9tYWluIG9mIGFheXVzaGdAbWl0LmVkdSBkZXNpZ25hdGVzIDE4LjkuMjguMTEgYXMgcGVybWl0dGVkIHNlbmRlcikgc210cC5tYWlsZnJvbT1hYXl1c2hnQG1pdC5lZHU7DQogICAgICAgZG1hcmM9cGFzcyAocD1OT05FIHNwPU5PTkUgZGlzPU5PTkUpIGhlYWRlci5mcm9tPW1pdC5lZHUNClJldHVybi1QYXRoOiA8YWF5dXNoZ0BtaXQuZWR1Pg0KUmVjZWl2ZWQ6IGZyb20gb3V0Z29pbmcubWl0LmVkdSAob3V0Z29pbmctYXV0aC0xLm1pdC5lZHUuIFsxOC45LjI4LjExXSkNCiAgICAgICAgYnkgbXguZ29vZ2xlLmNvbSB3aXRoIEVTTVRQUyBpZCBhMTgtMjAwMjBhYzg0NGIyMDAwMDAwYjAwMzFlZGY0NjZiNzNzaTQ2NjAxN3F0by42NC4yMDIyLjA3LjIwLjIwLjU1LjE5DQogICAgICAgIGZvciA8Ymlzd2FqaXRzYW1wcml0aUBnbWFpbC5jb20+DQogICAgICAgICh2ZXJzaW9uPVRMUzFfMiBjaXBoZXI9RUNESEUtRUNEU0EtQUVTMTI4LUdDTS1TSEEyNTYgYml0cz0xMjgvMTI4KTsNCiAgICAgICAgV2VkLCAyMCBKdWwgMjAyMiAyMDo1NToxOSAtMDcwMCAoUERUKQ0KUmVjZWl2ZWQtU1BGOiBwYXNzIChnb29nbGUuY29tOiBkb21haW4gb2YgYWF5dXNoZ0BtaXQuZWR1IGRlc2lnbmF0ZXMgMTguOS4yOC4xMSBhcyBwZXJtaXR0ZWQgc2VuZGVyKSBjbGllbnQtaXA9MTguOS4yOC4xMTsNCkF1dGhlbnRpY2F0aW9uLVJlc3VsdHM6IG14Lmdvb2dsZS5jb207DQogICAgICAgZGtpbT1wYXNzIGhlYWRlci5pPUBtaXQuZWR1IGhlYWRlci5zPW91dGdvaW5nIGhlYWRlci5iPWVIY3FiZGhHOw0KICAgICAgIHNwZj1wYXNzIChnb29nbGUuY29tOiBkb21haW4gb2YgYWF5dXNoZ0BtaXQuZWR1IGRlc2lnbmF0ZXMgMTguOS4yOC4xMSBhcyBwZXJtaXR0ZWQgc2VuZGVyKSBzbXRwLm1haWxmcm9tPWFheXVzaGdAbWl0LmVkdTsNCiAgICAgICBkbWFyYz1wYXNzIChwPU5PTkUgc3A9Tk9ORSBkaXM9Tk9ORSkgaGVhZGVyLmZyb209bWl0LmVkdQ0KUmVjZWl2ZWQ6IGZyb20gbWFpbC15dzEtZjE4Mi5nb29nbGUuY29tIChtYWlsLXl3MS1mMTgyLmdvb2dsZS5jb20gWzIwOS44NS4xMjguMTgyXSkNCgkoYXV0aGVudGljYXRlZCBiaXRzPTApDQogICAgICAgIChVc2VyIGF1dGhlbnRpY2F0ZWQgYXMgYWF5dXNoZ0BBVEhFTkEuTUlULkVEVSkNCglieSBvdXRnb2luZy5taXQuZWR1ICg4LjE0LjcvOC4xMi40KSB3aXRoIEVTTVRQIGlkIDI2TDN0STdPMDA4NTM0DQoJKHZlcnNpb249VExTdjEvU1NMdjMgY2lwaGVyPUFFUzEyOC1HQ00tU0hBMjU2IGJpdHM9MTI4IHZlcmlmeT1OT1QpDQoJZm9yIDxiaXN3YWppdHNhbXByaXRpQGdtYWlsLmNvbT47IFdlZCwgMjAgSnVsIDIwMjIgMjM6NTU6MTkgLTA0MDANCkRLSU0tU2lnbmF0dXJlOiB2PTE7IGE9cnNhLXNoYTI1NjsgYz1yZWxheGVkL3JlbGF4ZWQ7IGQ9bWl0LmVkdTsgcz1vdXRnb2luZzsNCgl0PTE2NTgzNzU3MTk7IGJoPVcrL1pHZEIxZDNJVTh4RjZDQVBicDRDaUQ5S2NlVVN4Z1dpZnhYQWZGK3c9Ow0KCWg9RnJvbTpEYXRlOlN1YmplY3Q6VG87DQoJYj1lSGNxYmRoR29GNVM4N2YrOXIvWFB0dDVEYmdCandnb1lUcytKTVBIcUFIZ2hzazhLVVRoQTFyZkhab2hvTENVUQ0KCSBxamVEbW1rQXg0aDdKeS9ldG1nemdJSGEwZmhVRHpmbDh6Y1NZUVNDU29zM0NRTERieVlkYzNVMjJyWW0xcVhmVE4NCgkgYzRsYlhJMVQvbit0b25tcnkyMG8wZ2I1YlhMVGZVWjZTblc5RitXSGhhUFBYY0pvK3cyNzREeExoL2tJcjRTaEJNDQoJIC80Qk16MHNOaXVHeGQrZzFyR3lsclAvcjVnTTRxeHl6SlRVZjA4UVljeCtEUURVc3o3dlpVUXZLUjVJV3dSSit6TA0KCSBCZjY5cElwckZuakIzeXk1MWVxeGpIZXFnWDFWeE5GVlV0S2FoZm5VTys0dTRWVGRBQzk1MU5rRDFLRzRzb0NHWVgNCgkgYmFIMnR6Ny96QXZnQT09DQpSZWNlaXZlZDogYnkgbWFpbC15dzEtZjE4Mi5nb29nbGUuY29tIHdpdGggU01UUCBpZCAwMDcyMTE1N2FlNjgyLTMxZTQ1NTI3ZGE1c280OTg5NTU3YjMuNQ0KICAgICAgICBmb3IgPGJpc3dhaml0c2FtcHJpdGlAZ21haWwuY29tPjsgV2VkLCAyMCBKdWwgMjAyMiAyMDo1NToxOCAtMDcwMCAoUERUKQ0KWC1HbS1NZXNzYWdlLVN0YXRlOiBBSklvcmE4aXlsUmVNZmU2RWxSL0hHL3AvTXFDcGhJVGNEL2hvYkpXS0ZZU3hWQVVOMHYycmIzbg0KCUMwc2s0dkdlcmlVUklNbkdxWCsrdUhMcFZzNHlPY3pscGFLZ3FIdz0NClgtUmVjZWl2ZWQ6IGJ5IDIwMDI6YTBkOmY2YzU6MDpiMDozMWQ6YWY3ZDo1ZDRmIHdpdGggU01UUCBpZA0KIGcxODgtMjAwMjBhMGRmNmM1MDAwMDAwYjAwMzFkYWY3ZDVkNGZtcjQ0MjU4MTI2eXdmLjE4Ny4xNjU4Mzc1NzE4MDA3OyBXZWQsIDIwDQogSnVsIDIwMjIgMjA6NTU6MTggLTA3MDAgKFBEVCkNCk1JTUUtVmVyc2lvbjogMS4wDQpGcm9tOiBBYXl1c2ggR3VwdGEgPGFheXVzaGdAbWl0LmVkdT4NCkRhdGU6IFdlZCwgMjAgSnVsIDIwMjIgMjM6NTU6MDYgLTA0MDANClgtR21haWwtT3JpZ2luYWwtTWVzc2FnZS1JRDogPENBK09KNVFmRU9NN0VFYlV6MCsya1cwdXQ2b0RaVDZ0c0J5N3BUazZEZ3pBTlQtTGROd0BtYWlsLmdtYWlsLmNvbT4NCk1lc3NhZ2UtSUQ6IDxDQStPSjVRZkVPTTdFRWJVejArMmtXMHV0Nm9EWlQ2dHNCeTdwVGs2RGd6QU5ULUxkTndAbWFpbC5nbWFpbC5jb20+DQpTdWJqZWN0OiBkZXNwZXJhdGVseSB0cnlpbmcgdG8gbWFrZSBpdCB0byBjaGFpbg0KVG86ICJiaXN3YWppdHNhbXByaXRpQGdtYWlsLmNvbSIgPGJpc3dhaml0c2FtcHJpdGlAZ21haWwuY29tPg0KQ29udGVudC1UeXBlOiBtdWx0aXBhcnQvYWx0ZXJuYXRpdmU7IGJvdW5kYXJ5PSIwMDAwMDAwMDAwMDA5Mzc3YWYwNWU0NDhhZjUxIg0KDQotLTAwMDAwMDAwMDAwMDkzNzdhZjA1ZTQ0OGFmNTENCkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbjsgY2hhcnNldD0iVVRGLTgiDQoNCndpbGwgd2UgbWFrZSBpdCB0aGlzIHRpbWUgaW50byB0aGUgemsgcHJvb2YNCg0KLS0wMDAwMDAwMDAwMDA5Mzc3YWYwNWU0NDhhZjUxDQpDb250ZW50LVR5cGU6IHRleHQvaHRtbDsgY2hhcnNldD0iVVRGLTgiDQoNCjxkaXYgZGlyPSJhdXRvIj53aWxsIHdlIG1ha2UgaXQgdGhpcyB0aW1lIGludG8gdGhlIHprIHByb29mPC9kaXY+DQoNCi0tMDAwMDAwMDAwMDAwOTM3N2FmMDVlNDQ4YWY1MS0tDQo=";

              const formattedArray = await insert13Before10(Uint8Array.from(Buffer.from(emailFull)));
              // Due to a quirk in carriage return parsing in JS, we need to manually edit carriage returns to match DKIM parsing
              console.log("formattedArray", formattedArray);
              console.log("buffFormArray", Buffer.from(formattedArray.buffer));
              console.log("buffFormArray", formattedArray.toString());
              console.log("ethereumAddress", ethereumAddress);
              const input = await generate_input.generate_inputs(Buffer.from(formattedArray.buffer), ethereumAddress);
              console.log("Generated input:", JSON.stringify(input));

              // Insert input structuring code here
              // const input = buildInput(pubkey, msghash, sig);
              // console.log(JSON.stringify(input, (k, v) => (typeof v == "bigint" ? v.toString() : v), 2));

              console.time("zk-dl");
              setDisplayMessage("Downloading compressed proving files... (this may take a few minutes)");
              await downloadProofFiles(filename);
              console.timeEnd("zk-dl");

              console.time("zk-gen");
              setDisplayMessage("Starting proof generation... (this will take 6-10 minutes and ~5GB RAM)");
              console.log("Starting proof generation");
              // alert("Generating proof, will fail due to input");
              const { proof, publicSignals } = await generateProof(input, filename);
              //const proof = JSON.parse('{"pi_a": ["19201501460375869359786976350200749752225831881815567077814357716475109214225", "11505143118120261821370828666956392917988845645366364291926723724764197308214", "1"], "pi_b": [["17114997753466635923095897108905313066875545082621248342234075865495571603410", "7192405994185710518536526038522451195158265656066550519902313122056350381280"], ["13696222194662648890012762427265603087145644894565446235939768763001479304886", "2757027655603295785352548686090997179551660115030413843642436323047552012712"], ["1", "0"]], "pi_c": ["6168386124525054064559735110298802977718009746891233616490776755671099515304", "11077116868070103472532367637450067545191977757024528865783681032080180232316", "1"], "protocol": "groth16", "curve": "bn128"}');
              //const publicSignals = JSON.parse('["0", "0", "0", "0", "0", "0", "0", "0", "32767059066617856", "30803244233155956", "0", "0", "0", "0", "27917065853693287", "28015", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "113659471951225", "0", "0", "1634582323953821262989958727173988295", "1938094444722442142315201757874145583", "375300260153333632727697921604599470", "1369658125109277828425429339149824874", "1589384595547333389911397650751436647", "1428144289938431173655248321840778928", "1919508490085653366961918211405731923", "2358009612379481320362782200045159837", "518833500408858308962881361452944175", "1163210548821508924802510293967109414", "1361351910698751746280135795885107181", "1445969488612593115566934629427756345", "2457340995040159831545380614838948388", "2612807374136932899648418365680887439", "16021263889082005631675788949457422", "299744519975649772895460843780023483", "3933359104846508935112096715593287", "556307310756571904145052207427031380052712977221"]');
              console.log("Finished proof generation");
              console.timeEnd("zk-gen");

              // alert("Done generating proof");
              setProof(JSON.stringify(proof));
              let kek = publicSignals.map((x: string) => BigInt(x));
              let soln = packedNBytesToString(kek.slice(0, 12));
              let soln2 = packedNBytesToString(kek.slice(12, 147));
              let soln3 = packedNBytesToString(kek.slice(147, 150));
              // setPublicSignals(`From: ${soln}\nTo: ${soln2}\nUsername: ${soln3}`);
              setPublicSignals(JSON.stringify(publicSignals));

              if (!circuitInputs) return;
              setLastAction("sign");
              setDisplayMessage("Finished computing ZK proof");
              try {
                (window as any).cJson = JSON.stringify(circuitInputs);
                console.log("wrote circuit input to window.cJson. Run copy(cJson)");
              } catch (e) {
                console.error(e);
              }
            }}
          >
            {displayMessage}
            <br />
            {">>>"}
          </button>
          <button
            disabled={emailFull.trim().length == 0}
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
            <br />
            {"<<<"}
          </button>
        </div>
        <LabeledTextArea
          label="Proof Output"
          value={proof}
          onChange={(e) => {
            setProof(e.currentTarget.value);
          }}
          warning={verificationMessage}
          warningColor={verificationPassed ? "green" : "red"}
        />
      </div>
      <div className="bottom">
        <h3>ZK Email</h3>
        <div>
          If you wish to generate a ZK proof of Twitter badge, you must do these: 1) Send yourself a password reset email from Twitter in incognito. 2) In your inbox, find the
          email from Twitter and download headers (three dots, then download message). 3) Copy paste the entire contents of the file into the box below 4) Paste in your sending
          Ethereum key 5) Click "Generate Proof" Note that it is completely client side and <a href="https://github.com/zk-email-verify/zk-email-verify/">open source</a>, and you
          are not trusting us with any private information.
          <br />
          Read our <a href="https://zkemail.xyz/docs"> docs </a> to learn more.
        </div>
        <br />
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

const LabeledTextAreaContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 15vh;
  padding: 8px 24px;
  align-items: center;
  position: relative;
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
  .secret {
    position: absolute;
    width: 100%;
    height: 100%;
    background: white;
    user-select: none;
    pointer-events: none;
    opacity: 0.95;
    justify-content: center;
    display: flex;
    align-items: center;
    transition: opacity 0.5s ease-in-out;
  }
  &:hover .secret,
  & :focus + .secret {
    opacity: 0;
  }
`;
