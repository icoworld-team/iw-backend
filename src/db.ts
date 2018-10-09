import mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.DB_URI;
console.log('DB_URI')
console.log(DB_URI)

// Setup DB.
const dbOptions = {
	useNewUrlParser: true,
	autoIndex: false, // Don't build indexes
	reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
	reconnectInterval: 500, // Reconnect every 500ms
	poolSize: 2, // Maintain up to 2 socket connections
	// If not connected, return errors immediately rather than waiting for reconnect
	bufferMaxEntries: 0,
	connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
	socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
	family: 4 // Use IPv4, skip trying IPv6
};

mongoose.set('debug', process.env.NODE_ENV === 'development');
const db = mongoose.connection;

export function close() {
	db.close((err) => {
		console.log(`Error closing DB connection: ${err}.`)
	});
}

export default async () => {
	db.on('error', (error) => { throw new Error(`Failed to connect to DB: ${error}`) })
		.on('close', () => console.log('DB connection closed.'))
		.once('open', () => console.log('Established connection to DB.'));
	
	const dbObj = await mongoose.connect(DB_URI, dbOptions);
	/* const modelNames = ['User'];
	modelNames.forEach(async (modelName) => {
		await mongoose.models[modelName].ensureIndexes();
	}) */
	return dbObj;
};