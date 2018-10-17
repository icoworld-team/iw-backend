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

export function formatChatDataWithUnreadMessages(chat, userId) {
    return {
        ...formatChatData(chat, userId),
        messages: chat.messages.map(message => formatMessageData(message))
    }
}

export function formatChatData(chat, userId) {
    const parnter = chat.members.filter(member => member._id.toString() !== userId)[0];
    return {
        chatId: chat._id,
        countUnreadMessages: chat.countUnreadMessages,
        parnter: {
            id: parnter._id,
            name: parnter.name
        },
    }
}

export default mongoose.model('Chat', schema);