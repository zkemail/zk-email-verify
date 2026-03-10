import hre from "hardhat";

const DEFAULT_RETRIES = parseInt(process.env.RETRIES ?? "5", 10);
const DEFAULT_DELAY_SECONDS = parseInt(process.env.DELAY ?? "10", 10);

export async function verifyWithRetry(
  label: string,
  args: Parameters<typeof hre.run>[1],
  retries = DEFAULT_RETRIES,
  delaySeconds = DEFAULT_DELAY_SECONDS,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `\n[${label}] Verification attempt ${attempt}/${retries} (delay=${delaySeconds}s)`,
      );
      await hre.run("verify:verify", args);
      console.log(`[${label}] Verification succeeded.`);
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `[${label}] Verification failed on attempt ${attempt}:`,
        err,
      );

      if (attempt < retries) {
        console.log(
          `[${label}] Waiting ${delaySeconds}s before next attempt...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delaySeconds * 1000),
        );
      }
    }
  }

  console.error(`[${label}] All ${retries} verification attempts failed.`);
  throw lastError;
}
