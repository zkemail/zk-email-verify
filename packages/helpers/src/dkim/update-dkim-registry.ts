import { ethers, AlchemyProvider, InfuraProvider } from 'ethers';
import formatDkimKey from './pull-and-format-dkim-key';
import { readFileSync } from 'fs';

require("dotenv").config();

const network = 'goerli'; // or whatever network you're using
const alchemyApiKey = process.env.ALCHEMY_GOERLI_KEY;
const infuraApiKey = process.env.INFURA_KEY;
const localSecretKey = process.env.PRIVATE_KEY || '0';
const default_abi = [{
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
  }];

async function updateMailserverKeys(domain: string, selector: string, contract_address: string, abi: any = default_abi, parallel = true) {
  // const provider = new AlchemyProvider(network, alchemyApiKey);
  const provider = new InfuraProvider(network, infuraApiKey);
  const wallet = new ethers.Wallet(localSecretKey, provider);
  const contract = new ethers.Contract(contract_address, abi, wallet);

  const publicKeyParts = await formatDkimKey(domain, selector);

  if (!publicKeyParts) {
      console.log('No public key found');
      return;
  }
  if (parallel) {
    let nonce = await provider.getTransactionCount(wallet.address);
    const txs = publicKeyParts.map(async (part, i) => {
      const tx = await contract.editMailserverKey(domain, i, part, { nonce: nonce++ });
      return tx.wait();
    });
    
    await Promise.all(txs);
    console.log("Updated all keys!")
  } else {
    for (let i = 0; i < publicKeyParts.length; i++) {
      const part = publicKeyParts[i];
      const tx = await contract.editMailserverKey(domain, i, part);
      await tx.wait();
      console.log(`Updated key ${i}!`);
    }
  }
}

async function testSelector(domain: string, selector: string) {
  try {
    const publicKeyParts = await formatDkimKey(domain, selector, false);
    if (publicKeyParts) {
      console.log(`Domain: ${domain}, Selector: ${selector} - Match found`);
      return { match: true, selector: selector, domain: domain };
    } else {
      // console.log(`Domain: ${domain}, Selector: ${selector} - No match found`);
    }
  } catch (error) {
    console.error(`Error processing domain: ${domain}, Selector: ${selector} - ${error}`);
  }
  return { match: false, selector: selector, domain: domain };
}

// Filename is a file where each line is a domain
// This searches for default selectors like "google" or "default"
async function getSelectors(filename: string) {
  const fs = require('fs');
  const selectors = ['google', 'default', 'mail', 'smtpapi', 'dkim', 'v1', 'v2', 'v3', 'k1', 'k2', 'k3', 'hs1', 'hs2', 's1', 's2', 's3', '200608', 'sig1', 'sig2', 'sig3', 'selector', 'selector1', 'selector2', '20230601', '20221208', '20210112', 'mindbox', 'bk', 'sm1', 'sm2', 'gmail', '10dkim1', '11dkim1', '12dkim1', 'memdkim', 'm1', 'mx', 'sel1', 'bk', 'scph1220', 'ml', 'pps1', 'scph0819', 'skiff1', 's1024', 'selector1'];

  const data = fs.readFileSync(filename, 'utf8');
  const domains = data.split('\n');
  
  let results = [];
  let domainIndex = 0;
  for (let domain of domains) {
    const promises = [];
    for (let selector of selectors) {
      promises.push(testSelector(domain, selector));
    }
    domainIndex++;
    results.push(...await Promise.all(promises));
  }
  const matchedDomains = new Set();
  const matchedSelectors: {[key: string]: string[]} = {};
  fs.writeFileSync('full_results.txt', JSON.stringify(results, null, 2));
  for (let result of results) {
    if(result.match) {
      matchedDomains.add(result.domain);
      if (!matchedSelectors[result.domain]) {
        matchedSelectors[result.domain] = [];
      }
      matchedSelectors[result.domain].push(result.selector);
    }
  }
  console.log("Domains with at least one matched selector: ");
  console.log(Array.from(matchedDomains));
  fs.writeFileSync('domain_results.txt', JSON.stringify(Array.from(matchedDomains), null, 2));
  fs.writeFileSync('selector_results.txt', JSON.stringify(matchedSelectors, null, 2));
}

let domain = process.argv[2] || 'gmail.com';
let selector = process.argv[3] || '20230601';
domain = 'protonmail.com';
selector = 'protonmail3';
domain = 'pm.me';
selector = 'protonmail3';
// updateMailserverKeys(domain, selector, "0xbfc2f7c49f040403eef1dbe8ad089fee87edbf57", default_abi);
getSelectors('src/dkim/domains.txt');