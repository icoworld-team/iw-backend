import Web3 = require('web3');
import { notNull } from '../util/common';

// ETH node URL.
export const ethUrl = process.env.ETH_NODE_URL || 'http://icoworld.projects.oktend.com:8545';
// Create a web3 connection
const web3 = new Web3();
try {
    web3.setProvider(new Web3.providers.HttpProvider(ethUrl));
} catch (error) {
    console.log('Failed to connect to etherium node');
    console.log(error);
}

export default web3;

// Any account value.
const ANY_ACCOUNT = '*';
/**
 * Get transactions for a given account till a given timestamp.
 * @param address 
 * @param timestamp 
 */
export async function getTransactionsForAccount(address:string = ANY_ACCOUNT, timestamp:number) {
    notNull(timestamp, "Timestamp");
    const lastNum = web3.eth.blockNumber;
    const arr = new Array();
    for(let i = lastNum; i >= 0; --i) {
        // Get block by number.
        const block = await web3.eth.getBlock(i, true);
        if (block && block.transactions && (timestamp <= block.timestamp)) {
            const date = new Date(block.timestamp * 1000).toUTCString();
            // Check through available transactions.
            await block.transactions.forEach((e) => {
                if (address == ANY_ACCOUNT || address == e.from || address == e.to) {
                    // Fill a transaction fields.
                    const trx = {
                        txhash: e.hash,
                        nonce: e.nonce,
                        blockHash: e.blockHash,
                        blockNumber: e.blockNumber,
                        txIndex: e.transactionIndex,
                        from: e.from,
                        to: e.to,
                        value: e.value,
                        time: date,
                        gasPrice: e.gasPrice,
                        gas: e.gas
                    }
                    arr.push(trx);
                }
            });
        }
    }
    return await arr.reverse();
}