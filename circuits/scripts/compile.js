require("dotenv").config();

const { execSync } = require("child_process");
const fs = require("fs");

let circuitsList = process.argv[2];
const deterministic = false;
const contributingExtraRandomness = true;
// process.argv[3] === "true" || process.argv[3] === undefined;

// TODO: add an option to generate with entropy for production keys

if (process.argv.length < 3 || process.argv.length > 6) {
  console.log("usage");
  console.log(
    "compile comma,seperated,list,of,circuits,or,--all [`true` if deterministic / `false` if not] [skip-r1cswasm to skip recompiling the circuit, anything else to recompile] [skip-zkey to skip recompiling the zkey, anything else to do it]"
  );
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
    let snarkJSPath = "./../node_modules/.bin/snarkjs";
    if (process.argv.length >= 4 && process.argv[4] === "skip-r1cswasm") {
      console.log("Skipping initial re generation of r1cs and wasm");
    } else {
      execSync(`circom ${circuitNamePrimary}.circom --r1cs --wasm --sym`, { stdio: "inherit" });
      execSync(`node --max-old-space-size=614400 ./../node_modules/snarkjs r1cs info ${circuitNamePrimary}.r1cs`, { stdio: "inherit" });
      execSync(`cp ${circuitNamePrimary}_js/${circuitNamePrimary}.wasm ${circuitNamePrimary}.wasm`, { stdio: "inherit" });
      execSync(`node ${circuitNamePrimary}_js/generate_witness.js ${circuitNamePrimary}.wasm inputs/input_${circuitNamePrimary}.json ${circuitNamePrimary}.wtns`, {
        stdio: "inherit",
      });
    }
    if (process.argv.length >= 5 && process.argv[5] === "skip-zkey" && process.argv[4] === "skip-r1cswasm") {
      console.log("Skipping initial re generation of zkey");
    } else {
      console.log("Generating zkey [very slow]...");
      let zkeyOutputName = "circuit";
      if (contributingExtraRandomness) {
        zkeyOutputName = "circuit_0";
      }
      execSync(
        `node --max-old-space-size=614400 ${snarkJSPath} groth16 setup ${circuitNamePrimary}.r1cs ../../powersoftau/powersOfTau28_hez_final_20.ptau ${zkeyOutputName}.zkey`,
        {
          stdio: "inherit",
        }
      );
      console.log("Done first zkey step!");
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
      execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey verify ${circuitNamePrimary}.r1cs ../../powersoftau/powersOfTau28_hez_final_20.ptau circuit.zkey`, {
        stdio: "inherit",
      });
      execSync(`node --max-old-space-size=614400 ${snarkJSPath} zkey export verificationkey circuit.zkey ${circuitName}/keys/verification_key.json`, {
        stdio: "inherit",
      });
      execSync(
        `node --max-old-space-size=614400 ${snarkJSPath} groth16 prove circuit.zkey ${circuitNamePrimary}.wtns ${circuitNamePrimary}_proof.json ${circuitNamePrimary}_public.json`,
        { stdio: "inherit" }
      );
      execSync(
        `node --max-old-space-size=614400 ${snarkJSPath} groth16 verify ${circuitName}/keys/verification_key.json ${circuitNamePrimary}_public.json ${circuitNamePrimary}_proof.json`,
        { stdio: "inherit" }
      );

      execSync(`mkdir -p ${cwd}/circuits/${circuitName}/compiled/`, { stdio: "inherit" });
      execSync(`mkdir -p ${cwd}/circuits/${circuitName}/keys/`, { stdio: "inherit" });

      execSync(`cp ${circuitNamePrimary}.wasm ${cwd}/circuits/${circuitName}/compiled/circuit.wasm`, { stdio: "inherit" });
      execSync(`cp circuit.zkey ${cwd}/circuits/${circuitName}/keys/circuit_final.zkey`, { stdio: "inherit" });
      // fs.copyFileSync("circuit.wasm", cwd + "/circuits/" + circuitName + "/compiled/circuit.wasm");
      // fs.unlinkSync("circuit.wasm");
      // fs.copyFileSync("circuit.zkey", cwd + "/circuits/" + circuitName + "/keys/circuit_final.zkey");
      // fs.unlinkSync("circuit.zkey");
    }
    execSync(
      `node --max-old-space-size=614400 ${snarkJSPath} zkey export solidityverifier ${cwd}/circuits/${circuitName}/keys/circuit_final.zkey ${cwd}/circuits/contracts/verifier.sol`,
      {
        stdio: "inherit",
      }
    );
    // copy files to appropriate places when integrated with scaffold-eth (zkaffold-eth)

    execSync(`mkdir -p ${cwd}/src/circuits/`, { stdio: "inherit" });
    execSync(`mkdir -p ${cwd}/src/contracts/`, { stdio: "inherit" });
    fs.copyFileSync(`${cwd}/circuits/contracts/verifier.sol`, `${cwd}/src/contracts/${circuitName}Verifier.sol`);
    fs.copyFileSync(`${cwd}/circuits/${circuitName}/compiled/circuit.wasm`, `${cwd}/src/circuits/${circuitName}_circuit.wasm`);
    fs.copyFileSync(`${cwd}/circuits/${circuitName}/keys/circuit_final.zkey`, `${cwd}/src/circuits/${circuitName}_circuit_final.zkey`);
    fs.copyFileSync(`${cwd}/circuits/${circuitName}/keys/verification_key.json`, `${cwd}/src/circuits/${circuitName}_verification_key.json`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
