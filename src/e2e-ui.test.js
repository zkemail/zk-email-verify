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

  it("should allow email and eth addr to be entered into inputs", async () => {
    await page.waitForSelector("[data-testid='status-not-started']");
    const emailValue = await page.$eval(emailInputSelector, e => e.value);
    expect(emailValue).toBe(testEmailText);
    const ethValue = await page.$eval(ethInputSelector, e => e.value);
    expect(ethValue).toBe(testEthAddress);
  });

  it("should start with an enabled prove button and status should be 'not-started'", async () => {
    await page.waitForSelector("[data-testid='status-not-started']");
    const proveButtonSelector = "button[data-testid='prove-button']";
    const proveButtonIsDisabled = await page.$eval(proveButtonSelector, button => button.disabled);
    expect(proveButtonIsDisabled).toBe(false);

    const status = await page.$eval("[data-testid='status-not-started']", e => e.attributes['data-testid'].value);
    expect(status).toBe("status-not-started");
  });

  afterAll(() => browser.close());
});