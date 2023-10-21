import { ethers } from 'ethers';
import formatDkimKey from '../../scripts/format_dkim_key';
import { readFileSync } from 'fs';

require("dotenv").config();

const network = 'goerli'; // or whatever network you're using
const alchemyApiKey = process.env.ALCHEMY_GOERLI_KEY;
const localSecretKey = process.env.PRIVATE_KEY || '0';

async function updateMailserverKeys(domain: string, selector: string) {
    const provider = new ethers.providers.AlchemyProvider(network, alchemyApiKey);
    const wallet = new ethers.Wallet(localSecretKey, provider);
    const abi = JSON.parse(readFileSync('./abi/MailServer.abi', 'utf8'));
    const contract = new ethers.Contract("0xbfc2f7c49f040403eef1dbe8ad089fee87edbf57", abi, wallet);

    const publicKeyParts = await formatDkimKey(domain, selector);

    if (!publicKeyParts) {
        console.log('No public key found');
        return;
    }

    let nonce = await wallet.getTransactionCount();
    const txs = publicKeyParts.map(async (part, i) => {
        const tx = await contract.editMailserverKey(domain, i, part, { nonce: nonce++ });
        return tx.wait();
    });

    await Promise.all(txs);
    console.log("Updated all keys!")
}

const domain = process.argv[2] || 'gmail.com';
const selector = process.argv[3] || '20230601';
updateMailserverKeys(domain, selector);
