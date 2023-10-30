import { ethers, AlchemyProvider } from 'ethers';
import formatDkimKey from './pull-and-format-dkim-key';
import { readFileSync } from 'fs';

require("dotenv").config();

const network = 'goerli'; // or whatever network you're using
const alchemyApiKey = process.env.ALCHEMY_GOERLI_KEY;
const localSecretKey = process.env.PRIVATE_KEY || '0';
const default_abi = {
    "inputs": [
      {
        "internalType": "string",
        "name": "domain",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "val",
        "type": "uint256"
      }
    ],
    "name": "editMailserverKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };

async function updateMailserverKeys(domain: string, selector: string, contract_address: string, abi: any = default_abi) {
    const provider = new AlchemyProvider(network, alchemyApiKey);
    const wallet = new ethers.Wallet(localSecretKey, provider);
    const contract = new ethers.Contract(contract_address, abi, wallet);

    const publicKeyParts = await formatDkimKey(domain, selector);

    if (!publicKeyParts) {
        console.log('No public key found');
        return;
    }

    let nonce = await provider.getTransactionCount(wallet.address);
    const txs = publicKeyParts.map(async (part, i) => {
        const tx = await contract.editMailserverKey(domain, i, part, { nonce: nonce++ });
        return tx.wait();
    });

    await Promise.all(txs);
    console.log("Updated all keys!")
}

const domain = process.argv[2] || 'gmail.com';
const selector = process.argv[3] || '20230601';
updateMailserverKeys(domain, selector, "0xbfc2f7c49f040403eef1dbe8ad089fee87edbf57", default_abi);