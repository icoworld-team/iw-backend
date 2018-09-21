import mongoose = require('mongoose');
import { formatMessageData } from './Message';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Chat schema definition.
const schema = new Schema({
    members: [{
        type: ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [{
        type: ObjectId,
        ref: 'Message'
    }]
});

export function formatChatDataWithLastMessage(chat, userId) {
    const lastMessage = chat.messages[0];
    return {
        ...formatChatData(chat, userId),
        lastMessage: formatMessageData(lastMessage)
    }
}

export function formatChatData(chat, userId) {
    const parnter = chat.members.filter(member => member._id.toString() !== userId)[0];
    return {
        chatId: chat._id,
        parnter: {
            id: parnter._id,
            name: parnter.name
        },
    }
}

/* function formatPartnerData(partnerData) {
    const { _id, name } = partnerData;
    return {
        id: _id,
        name
    }
} */

export default mongoose.model('Chat', schema);