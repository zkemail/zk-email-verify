require("dotenv").config();

const { execSync } = require("child_process");
const fs = require("fs");

let circuitsList = process.argv[2];
const deterministic = false;
const contributingExtraRandomness = true;
// process.argv[3] === "true" || process.argv[3] === undefined;

// TODO: add an option to generate with entropy for production keys

if (process.argv.length < 3 || process.argv.length > 5) {
  console.log("usage");
  console.log("compile comma,seperated,list,of,circuits,or,--all [`true` if deterministic / `false` if not] [skip-recompile to skip recompiling the circuit]");
  process.exit(1);
}

const cwd = process.cwd();
console.log(cwd);

if (circuitsList === "-A" || circuitsList === "--all") {
  try {
    circuitsList = fs
      .readdirSync(cwd + "/circuits", { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .join();

    console.log("Compiling all circuits...");
    console.log(circuitsList);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

for (let circuitName of circuitsList.split(",")) {
  let beacon;
  if (!process.env["beacon"]) {
    console.log("INSECURE ZKEY: You dont have a beacon in your .env file, test beacon assigned");
    beacon = "test";
  } else {
    beacon = process.env["beacon"];
  }

  console.log("\nCompiling and sorting files for circuit: " + circuitName + "...");

  process.chdir(cwd + "/circuits/");

  if (!fs.existsSync("compiled")) {
    fs.mkdirSync("compiled");
  }
  if (!fs.existsSync("contracts")) {
    fs.mkdirSync("contracts");
  }
  if (!fs.existsSync("inputs")) {
    fs.mkdirSync("inputs");
  }
  if (!fs.existsSync("keys")) {
    fs.mkdirSync("keys");
  }

  // doesnt catch yet
  // https://github.com/iden3/snarkjs/pull/75
  // node --max-old-space-size=614400 ${snarkJSPath} ->
  // node --max-old-space-size=614400 ${snarkJSPath}`

  try {
    let circuitNamePrimary = circuitName.split("/").pop();
    let snarkJSPath = "./../node_modules/snarkjs";
    if (process.argv.length >= 4 && process.argv[4] === "skip-recompile") {
      console.log("Skipping recompile to r1cs and wasm");
    } else {
      execSync(`circom ${circuitNamePrimary}.circom --r1cs --wasm --sym`, { stdio: "inherit" });
    }
    execSync(`node --max-old-space-size=614400 ./../node_modules/snarkjs r1cs info ${circuitNamePrimary}.r1cs`, { stdio: "inherit" });
    execSync(`cp ${circuitNamePrimary}_js/${circuitNamePrimary}.wasm circuit.wasm`, { stdio: "inherit" });
    execSync(`node ${circuitNamePrimary}_js/generate_witness.js circuit.wasm inputs/input_rsa.json witness.wtns`, {
      stdio: "inherit",
    });
    console.log("starting beefy boy");
    let zkeyOutputName = "circuit";
    if (contributingExtraRandomness) {
      zkeyOutputName = "circuit_0";
    }
    execSync(`node --max-old-space-size=614400 ${snarkJSPath} groth16 setup ${circuitNamePrimary}.r1cs ../../powersoftau/powersOfTau28_hez_final_21.ptau ${zkeyOutputName}.zkey`, {
      stdio: "inherit",
    });
    console.log("ending beefy boy");
    if (contributingExtraRandomness) {
      if (deterministic) {
        execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey beacon circuit_0.zkey circuit.zkey ` + beacon + " 10", {
          stdio: "inherit",
        });
      } else {
        execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey contribute circuit_0.zkey circuit.zkey ` + `-e="${Date.now()}"`, {
          stdio: "inherit",
        });
      }
    }
    execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey verify ${circuitNamePrimary}.r1cs ../../powersoftau/powersOfTau28_hez_final_24.ptau circuit.zkey`, {
      stdio: "inherit",
    });
    execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey export verificationkey circuit.zkey keys/verification_key.json`, {
      stdio: "inherit",
    });
    execSync(`node --max-old-space-size=614400 ${snarkJSPath} groth16 prove circuit.zkey witness.wtns proof.json public.json`, { stdio: "inherit" });
    execSync(`node --max-old-space-size=614400 ${snarkJSPath} groth16 verify keys/verification_key.json public.json proof.json`, { stdio: "inherit" });

    execSync(`mkdir -p ` + cwd + "/circuits/" + circuitName + "/compiled/", { stdio: "inherit" });
    execSync(`mkdir -p ` + cwd + "/circuits/" + circuitName + "/keys/", { stdio: "inherit" });

    execSync(`cp circuit.wasm ` + cwd + "/circuits/" + circuitName + "/compiled/circuit.wasm", { stdio: "inherit" });
    execSync(`cp circuit.zkey ` + cwd + "/circuits/" + circuitName + "/keys/circuit_final.zkey", { stdio: "inherit" });
    // fs.copyFileSync("circuit.wasm", cwd + "/circuits/" + circuitName + "/compiled/circuit.wasm");
    // fs.unlinkSync("circuit.wasm");
    // fs.copyFileSync("circuit.zkey", cwd + "/circuits/" + circuitName + "/keys/circuit_final.zkey");
    // fs.unlinkSync("circuit.zkey");

    execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey export solidityverifier keys/circuit_final.zkey contracts/verifier.sol`, {
      stdio: "inherit",
    });
    // copy files to appropriate places when integrated with scaffold-eth (zkaffold-eth)
    fs.copyFileSync("contracts/verifier.sol", cwd + "/../hardhat/contracts/" + circuitName + "Verifier.sol");

    if (!fs.existsSync(cwd + "/../react-app/src/circuits/")) {
      fs.mkdirSync(cwd + "/../react-app/src/circuits/");
    }
    fs.copyFileSync("compiled/circuit.wasm", cwd + "/../react-app/src/circuits/" + circuitName + "_circuit.wasm");
    fs.copyFileSync("keys/circuit_final.zkey", cwd + "/../react-app/src/circuits/" + circuitName + "_circuit_final.zkey");
    fs.copyFileSync("keys/verification_key.json", cwd + "/../react-app/src/circuits/" + circuitName + "_verification_key.json");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
