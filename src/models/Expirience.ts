import mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Employment/education schema definition.
const Expirience = new Schema({
    name: {
        type: String,
        required: true
    },
    from: {
        type: Date,
        required: true
    },
    to: {
        type: Date,
        required: true
    }
});

// Compose user object properties for UI
export function getExpirienceData(item) {
    return {
        id: item._id,
        userId: item.userId._id,
        name: item.name,
        from: item.from,
        to: item.to,
    }
}

export default Expirience;