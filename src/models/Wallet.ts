import mongoose = require('mongoose');

// Wallet schema definition.
const Wallet = new mongoose.Schema({
    kind: {
        type: String,
        default: 'ETH'
    },
    address: String,
});

export default Wallet;