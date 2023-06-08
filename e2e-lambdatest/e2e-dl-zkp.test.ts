import puppeteer, { Page } from "puppeteer";
import fs from "fs";
import path from "path";

const pageUrl = "https://dev.zkemail.xyz/";

const testEthAddress = "0x00000000000000000000";
const testEmailFilePath = path.join(__dirname, "..", "src", "__fixtures__/email/zktestemail.test-eml");
const testEmailText = fs.readFileSync(testEmailFilePath, "utf8"); 

// puppeteer test helpers
const emailInputSelector = "textarea[aria-label='Full Email with Headers']";
const ethInputSelector = "input[placeholder='Ethereum Address']";
const proofTextareaSelector = "textarea[aria-label='Proof Output']";

const downloadTimeout = 10000000;
const proofTimeout = 10000000;

const setTextAreaValue = async (page: Page, selector: string, value: string) => {
    // This is a workaround for the fact that page.keyboard.type() is too slow.
    return await page.$eval(selector, async (element: any, value: string) => {
      function setNativeValue(element: any, value: string) {
        // @ts-ignore
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        // @ts-ignore
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        
        if (valueSetter && valueSetter !== prototypeValueSetter) {
          // @ts-ignore
        	prototypeValueSetter.call(element, value);
        } else {
          // @ts-ignore
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      setNativeValue(element, value);
    }, value);
};

const gotToPageAndEnterInputs = async (page: Page, emailInputSelector: string, ethInputSelector: string, testEmailText: string, testEthAddress: string) => {
    await page.goto(pageUrl);
    await page.waitForSelector(emailInputSelector);
    // 'page.keyboard.type()' takes too long. Use workaround.
    // await page.focus(emailInputSelector);
    // await page.keyboard.type(testEmailText); 
    await setTextAreaValue(page, emailInputSelector, testEmailText);
    await page.waitForSelector(ethInputSelector);
    await page.focus(ethInputSelector);
    await page.keyboard.type(testEthAddress);
}

describe("App.js", () => {

  beforeAll(async () => {
    await gotToPageAndEnterInputs(page, emailInputSelector, ethInputSelector, testEmailText, testEthAddress);
  }, 60000);

  it("should start download and run zkproof after entering inputs and click", async () => {
    await page.waitForSelector("[data-testid='status-not-started']");
    console.log("starting e2e test...this will take up to 10 minutes and consume bandwidth and cpu time")
    const proveButtonSelector = "button[data-testid='prove-button']";
    await page.click(proveButtonSelector);
    // starting download
    console.log("starting download...this will take up to 10 minutes and consume bandwidth");
    const proveButtonIsDisabled = await page.$eval(proveButtonSelector, button => (button as HTMLButtonElement).disabled);
    expect(proveButtonIsDisabled).toBe(true);

    let status;
    await page.waitForSelector("[data-testid='status-downloading-proof-files']");
    status = await page.$eval("[data-testid='status-downloading-proof-files']", e => e.attributes['data-testid'].value);
    expect(status).toBe("status-downloading-proof-files");

    await page.waitForSelector("[data-testid='status-generating-proof']", {timeout: downloadTimeout});
    console.log("finished download...starting proof");
    console.log("starting proof...this will take up to 10 minutes and consume cpu time");
    status = await page.$eval("[data-testid='status-generating-proof']", e => e.attributes['data-testid'].value);
    expect(status).toBe("status-generating-proof");

    await page.waitForSelector("[data-testid='status-done']", {timeout: proofTimeout});
    status = await page.$eval("[data-testid='status-done']", e => e.attributes['data-testid'].value);
    expect(status).toBe("status-done");

    // check proof
    const proofValue = await page.$eval(proofTextareaSelector, e => (e as HTMLInputElement).value);
    const proofObj = JSON.parse(proofValue);
    expect(proofObj["pi_a"]).toBeTruthy();
    expect(proofObj["pi_b"]).toBeTruthy();
    expect(proofObj["pi_c"]).toBeTruthy();
    expect(proofObj["protocol"]).toBe("groth16");
    expect(proofObj["curve"]).toBe("bn128");

    // report times
    const downloadTime = await page.$eval("[data-testid='download-time']", e => e.textContent);
    const proofTime = await page.$eval("[data-testid='proof-time']", e => e.textContent);
    console.log("Completed download and proof");
    console.log("download in ms took", downloadTime);
    console.log("proof in ms took", proofTime);
  }, proofTimeout + downloadTimeout + 30000);

});
