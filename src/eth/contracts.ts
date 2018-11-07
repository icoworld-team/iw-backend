import fs = require('fs');
import web3, {ethUrl} from './util';
import { notNull, sleep } from '../util/common';

// Defintion of 'from' address.
const accountAddr = process.env.ETH_FROM_ACCOUNT; //  || web3.eth.coinbase;
// Default price.
const priceGas = process.env.ETH_DEPLOY_PRICE || 100000;
// Default wait for block timeout.
const blocksTimeout = process.env.ETH_WAIT_TIMEOUT || 30000;
// Private key or password.
const privateKey = process.env.ETH_PRIVATE_KEY || "";

// Read the contracts bundle.
const source = fs.readFileSync('contracts.json', {encoding: 'utf8'});
const contracts = JSON.parse(source)["contracts"];

/**
 * Get contract by name.
 * @param name 
 */
export function getContract(name: string) {
    // Get source
    let _src: string = contracts[name].src;
    if(_src.length < 50) {
        const cpath = `${process.cwd}/sol/${_src.trim()}`;
        if(fs.existsSync(cpath))
            _src = fs.readFileSync(cpath, {encoding: 'utf8'});
        else
            console.log(`Cannot read source for contract: <${name}>. Path ${cpath} doesn't exists!`);   
    }
    // Get ABI description
    const _abi = contracts[name].abi;

    // Smart contract EVM bytecode as hex
    const _bin = '0x' + contracts[name].bin;

    return {
        abi: _abi,
        bin: _bin,
        src: _src
    }
}

/**
 * Wait for blocks to be mined. 
 * @param contract 
 * @param timeout 
 */
async function waitForBlocks(contract, timeout) {
    let address = undefined;
    while (true) {
        let receipt = web3.eth.getTransactionReceipt(contract.transactionHash);
        if (receipt && receipt.contractAddress) {
            console.log(`Contract has been deployed with address: ${receipt.contractAddress}`);
            address = receipt.contractAddress;
            break;
        }
        console.log(`Waiting... currently in block: ${web3.eth.blockNumber}`);
        await sleep(timeout);
    }
    return address;
}

/**
 * Deploy a contract with given name.
 * @param name
 * @param args 
 */
export async function deployContract(name: string, args) {
    notNull(name, 'Contract name');
    web3.personal.unlockAccount(accountAddr, privateKey, 60000);
    console.log("Unlock the account...");
    // Create contract instance.
    const { abi, bin, src } = getContract(name);
    // Create Contract proxy class
    const factory = web3.eth.contract(abi);
    console.log("Deploying the contract...");
    // Deploy the contract.
    const contract = factory.new(...args, { from: accountAddr, gas: priceGas, data: bin });
    // Transaction has entered to memory pool
    console.log(`Contract is being deployed in transaction at ${ethUrl}, hash: ${contract.transactionHash}`);
    const encAbi = factory.new.getData(args, {data: bin});

    const _address = await waitForBlocks(contract, blocksTimeout);
    return {
        source: src,
        abi: encAbi,
        address: _address,
    }
}

