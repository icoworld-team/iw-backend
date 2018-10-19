import mongoose = require('mongoose');
import Wallet from './Wallet';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Available statuses.
export const Status = {
    Created: 0,
    Removed: 1,
    Blocked: 2,
    OnHold: 3,
    Verified: 4,
    Deploying: 5,
    DeployFailed: 6,
    Deployed: 7,
    WaitForStart: 8,
    Started: 9,
    Cancelled: 10
}

// Contract name associated with pool.
const ContractName = 'TestContract';

// Pool deployed contract data.
const ContractData = new mongoose.Schema({
    abi: String,
    address: String
});

// Pool member definition.
const Member = new Schema({
    user_id: {
        type: ObjectId,
        ref: 'User'
    },
    summ: Number
});

// Pool schema definition.
const schema = new Schema({
    owner: {
        type: ObjectId,
        ref: 'User'
    },
    name: String,
    poolName: String,
    status: {
        type: Number,
        default: Status.Created
    },
    contract: {
        type: String,
        required: true
    },
    deploy: ContractData,
    /* description: String, */
    projectLink: String,
    wallet: Wallet,
    sum_min: String,
    sum_max: String,
    sum_mbr_min: String,
    sum_mbr_max: String,
    endDate: Date,
    comissionPaymentAddress: String,
    comission: Number,
    lead_comission: Number,
    members: [Member]
}, { timestamps: true });

// transform object's properties for db
export function formatPoolData(input) {
    const {
        owner,
        projectName,
        projectLink,
        projectAdress,
        poolSoftCap,
        poolHardCap,
        minDeposit,
        maxDeposit,
        endDate,
        ownerComission,
        comissionPaymentAddress,
        iwComission
    } = input;

    return {
        owner,
        name: projectName,
        projectLink,
        contract: ContractName,
        wallet: {
            address: projectAdress
        },
        sum_min: poolSoftCap,
        sum_max: poolHardCap,
        sum_mbr_min: minDeposit,
        sum_mbr_max: maxDeposit,
        endDate: endDate,
        lead_comission: ownerComission,
        comissionPaymentAddress,
        comission: iwComission
    }
}

// Compose pool object properties (that needed for result of pool's search) for UI
export function getPoolData(pool) {
    return {
        poolId: pool._id,
        poolName: pool.poolName,
        status: pool.status,
        ownerId: pool.owner._id,
        ownerName: pool.owner.name,
        projectName: pool.name,
        projectAdress: pool.wallet.address,
        poolSoftCap: pool.sum_min,
        poolHardCap: pool.sum_max,
        minDeposit: pool.sum_mbr_min,
        maxDeposit: pool.sum_mbr_max,
        endDate: pool.endDate,
        ownerComission: pool.lead_comission,
        iwComission: pool.comission,
    }
}

export function getPoolDataForSearchResult(pool) {
    return {
        poolId: pool._id,
        poolName: pool.poolName,
        ownerId: pool.owner._id,
        ownerName: pool.owner.name,
        projectName: pool.name,
        endDate: pool.endDate
    }
}

export function generatePoolName() {
    const number = Math.floor(Math.random() * 1000)
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = date.getMonth() + 1;
    const dateOFMonth = date.getDate()
    const poolName = `${number}-${dateOFMonth}/${month}/${year}`;
    return poolName;
}

export default mongoose.model('Pool', schema);