import puppeteer, { Page } from "puppeteer";
import fs from "fs";
import path from "path";

const pageUrl = "https://dev.zkemail.xyz/";

const testEthAddress = "0x00000000000000000000";
const testEmailFilePath = path.join(__dirname, "..", "src", "__fixtures__/email/zktestemail.test-eml");
const testEmailText = fs.readFileSync(testEmailFilePath, "utf8"); 
// const testProofFile = "/__fixtures__/proofs/zktestemail.test-proof.json"
// const testProofText = fs.readFileSync(__dirname + testProofFile, "utf8"); 

// puppeteer test helpers
const emailInputSelector = "textarea[aria-label='Full Email with Headers']";
const ethInputSelector = "input[placeholder='Ethereum Address']";
// const proofTextareaSelector = "textarea[aria-label='Proof Output']";

// const downloadTimeout = 10000000;
// const proofTimeout = 10000000;

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

  it("should allow email and eth addr to be entered into inputs", async () => {
    await page.waitForSelector("[data-testid='status-not-started']");
    const emailValue = await page.$eval(emailInputSelector, e => (e as HTMLInputElement).value);
    expect(emailValue).toBe(testEmailText);
    const ethValue = await page.$eval(ethInputSelector, e => (e as HTMLInputElement).value);
    expect(ethValue).toBe(testEthAddress);
  });

  it("should start with an enabled prove button and status should be 'not-started'", async () => {
    await page.waitForSelector("[data-testid='status-not-started']");
    const proveButtonSelector = "button[data-testid='prove-button']";
    const proveButtonIsDisabled = await page.$eval(proveButtonSelector, button => (button as HTMLButtonElement).disabled);
    expect(proveButtonIsDisabled).toBe(false);

    const status = await page.$eval("[data-testid='status-not-started']", e => e.attributes['data-testid'].value);
    expect(status).toBe("status-not-started");
  });

});