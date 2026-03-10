import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@parity/hardhat-polkadot";
import "dotenv/config";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      polkadot: {
        target: "evm",
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
        target: "evm",
      },
      url: `http://127.0.0.1:8545`,
    },
    polkadotHubTestnet: {
      polkadot: {
        target: "evm",
      },
      url: "https://services.polkadothub-rpc.com/testnet",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      polkadotHubTestnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "polkadotHubTestnet",
        chainId: 420420417,
        urls: {
          apiURL: "https://blockscout-testnet.polkadot.io/api",
          browserURL: "https://blockscout-testnet.polkadot.io/",
        },
      },
    ],
  },

  solidity: {
    version: "0.8.34",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
      evmVersion: "osaka",
    },
  },
  resolc: {
    version: "1.0.0",
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
  },
};

export default config;
