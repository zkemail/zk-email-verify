const puppeteer = require("puppeteer");
const { vkey } = require("./vkey");
const { readFileSync } = require("fs");

//declare var snarkjs;


const runBenchmark = async (cap) => {
    console.log("Setting up test -->", cap['name'])
    if (!process.env.INPUT_FILE_PATH) {
        throw new Error("INPUT_FILE_PATH not found, please provide a valid email to test with");
    }

    const input = JSON.parse(readFileSync(process.env.INPUT_FILE_PATH, 'utf-8'));
    const toInject = {
        input,
        vkey,
    }

    console.log("Starting test -->", cap['name'])

    cap['browserstack.username'] = process.env.BROWSERSTACK_USERNAME || 'YOUR_USERNAME';
    cap['browserstack.accessKey'] = process.env.BROWSERSTACK_ACCESS_KEY || 'YOUR_ACCESS_KEY';
    cap["browserstack.console"] = "verbose";

    const browser = await puppeteer.connect({
        browserWSEndpoint:
        `wss://cdp.browserstack.com/puppeteer?caps=${encodeURIComponent(JSON.stringify(cap))}`,  // The BrowserStack CDP endpoint gives you a `browser` instance based on the `caps` that you specified
      });
  
  
    const page = await browser.newPage();
    await page.goto(process.env.SNARKJS_WEB_SITE || "https://immanuelsegol.github.io/");
    
    // wait for title to load 
    await page.title();

    const benchmark_results = await page.evaluate(async (toInject) => {
        const { input, vkey } = toInject;

        async function generateProof(input, filename) {
            console.log("generating proof for input");
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, `https://zkemail-zkey-chunks.s3.amazonaws.com/${filename}.wasm`, `https://zkemail-zkey-chunks.s3.amazonaws.com/${filename}.zkey`);

            return {
              proof,
              publicSignals,
            };
        }

        async function verifyProof(proof, publicSignals, vkey) {
            const proofVerified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
          
            return proofVerified;
        }

        const gen_t0 = performance.now();
        const { proof, publicSignals } = await generateProof(input, "email");
        const gen_t1 = performance.now();
        
        const verify_t0 = performance.now();
        await verifyProof(proof, publicSignals, vkey);
        const verify_t1 = performance.now();

        return {
            timeToGenerateProof: gen_t1 - gen_t0,
            timeToVerifyProof: verify_t1 - verify_t0,
        }
    }, toInject);

    console.log("--- Benchmark results ---");
    console.log(benchmark_results, cap);
    console.log("---> Benchmark results ---");
    await browser.close();
};



const benches = [
{
    prover: "groth16",
    lang: "circom",
    circuit: "poseidonex_test",
}
]

const platforms = [
{
    'browser': 'chrome',
    'browser_version': 'latest',
    'os': 'osx',
    'os_version': 'catalina',
    'name': 'Chrome latest on Catalina',
    'build': 'puppeteer-build-2'
},
{
    'browser': 'firefox',
    'browser_version': 'latest',
    'os': 'osx',
    'os_version': 'catalina',
    'name': 'Firefox latest on Catalina',
    'build': 'puppeteer-build-2'
}];

benches.forEach(b => {
switch (b.prover) {
    case "groth16":
    platforms.forEach(async (cap) => {
        await runBenchmark(cap);
    });
    return
    default:
    throw new Error(`bench for ${b.prover} not implemented`);
}
})
