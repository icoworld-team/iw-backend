import mongoose = require('mongoose');

const Schema = mongoose.Schema;

// News schema definition.
const schema = new Schema({
  title: String
}, { timestamps: true });

// Compose news object properties for UI
export function getNewsData(news) {
    return {
        id: news._id,
        title: news.title,
        date: news.createdAt
    }
}

export default mongoose.model('News', schema);   