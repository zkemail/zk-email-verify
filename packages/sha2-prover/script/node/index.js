const {
    generateEmailVerifierInputs,
} = require("@zk-email/helpers/dist/input-generators");
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

// Parse raw email to circuit inputs and save that to ./email-inputs.json to be used by the main rust program.
async function main() {
    const rawEmail = readFileSync(join(__dirname, "./email.eml"), "utf8");
    const inputs = await generateEmailVerifierInputs(rawEmail, {
        maxHeadersLength: 640,
        maxBodyLength: 768,
    });

    writeFileSync(
        "./input.json",
        JSON.stringify({
            body: inputs.emailBody,
            signature: inputs.signature,
        })
    );
}

main()
    .then(() => {})
    .catch((error) => {
        console.error("Unhandled error:", error);
    });
