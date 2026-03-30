import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-ignition-ethers";
import "@nomicfoundation/hardhat-verify";
import "@parity/hardhat-polkadot";
import "dotenv/config";

const rpcUrl = process.env.RPC_URL;
const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      polkadot: {
        target: "pvm",
      },
      nodeConfig: {
        nodeBinaryPath: "./bin/dev-node",
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: "./bin/eth-rpc",
        dev: true,
      },
    },
    localNode: {
      polkadot: {
        target: "pvm",
      },
      url: `http://127.0.0.1:8545`,
    },
    // Polkadot Hub Testnet
    "420420417": {
      polkadot: {
        target: "pvm",
      },
      url: rpcUrl || "https://services.polkadothub-rpc.com/testnet",
      accounts,
    },
    // Base Sepolia
    "84532": {
      url: rpcUrl || "https://sepolia.base.org",
      accounts,
    },
    // Ethereum Sepolia
    "11155111": {
      url: rpcUrl || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        chainId: 11155111,
        network: "11155111",
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io/",
        },
      },
      {
        chainId: 84532,
        network: "84532",
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
    ],
  },
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
      evmVersion: "prague",
    },
  },
  resolc: {
    version: "0.5.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  paths: {
    sources: "src",
    tests: "hh-tests",
    cache: "hh-cache",
    artifacts: "hh-artifacts",
    ignition: "hh-ignition",
  },
};

export default config;
