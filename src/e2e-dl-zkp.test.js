import puppeteer from "puppeteer";
import fs from "fs";

const testEthAddress = "0x00000000000000000000";
const testEmailFile = "/__fixtures__/email/zktestemail.test-eml"
const testEmailText = fs.readFileSync(__dirname + testEmailFile, "utf8"); 

// puppeteer test helpers
const emailInputSelector = "textarea[aria-label='Full Email with Headers']";
const ethInputSelector = "input[placeholder='Ethereum Address']";
const pageUrl = "http://localhost:3000";

const downloadTimeout = 10000000;
const proofTimeout = 10000000;

const setTextAreaValue = async (page, selector, value) => {
    // This is a workaround for the fact that page.keyboard.type() is too slow.
    return await page.$eval(selector, async (element, value) => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        
        if (valueSetter && valueSetter !== prototypeValueSetter) {
        	prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      setNativeValue(element, value);
    }, value);
};

const gotToPageAndEnterInputs = async (page, emailInputSelector, ethInputSelector, testEmailText, testEthAddress) => {
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
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      // headless: true,
      headless: false,
      slowMo: 100
    });
    page = await browser.newPage();
    await gotToPageAndEnterInputs(page, emailInputSelector, ethInputSelector, testEmailText, testEthAddress);
  }, 60000);

  it("should start download and run zkproof after entering inputs and click", async () => {
    await page.waitForSelector("[data-testid='status-not-started']");
    console.log("starting e2e test...this will take up to 10 minutes and consume bandwidth and cpu time")
    const proveButtonSelector = "button[data-testid='prove-button']";
    await page.click(proveButtonSelector);
    // starting download
    console.log("starting download...this will take up to 10 minutes and consume bandwidth");
    const proveButtonIsDisabled = await page.$eval(proveButtonSelector, button => button.disabled);
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

    // report times
    const downloadTime = await page.$eval("[data-testid='download-time']", e => e.textContent);
    const proofTime = await page.$eval("[data-testid='proof-time']", e => e.textContent);
    console.log("Completed download and proof");
    console.log("download in ms took", downloadTime);
    console.log("proof in ms took", proofTime);
  }, proofTimeout + downloadTimeout + 30000);

  afterAll(() => browser.close());
});