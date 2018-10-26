import * as path from 'path';
require('dotenv').config();

// Dev mode flag
export const DEV_MODE = process.env.NODE_ENV === 'development';

// Maximum size of DB pool connecions.
export const DB_MAX_CONNS = parseInt(process.env.DB_MAX_CONNS) || 5;
// Verify contract URL.
export const verifyContractLink = process.env.ETH_VERIFY_CONTRACT_URL || 'https://etherscan.io/verifyContract';
// The path for serving static files.
export const STATIC_ROOT = path.join(process.env.STATIC_PATH || process.cwd(),'static');
// Session keys value.
export const SESSION_KEYS = process.env.SESSION_KEYS || '97Jix8Mcc4G+CD02iunYB6sZTjXxQfks';
// Session max age (ms)
export const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 1800000;
// Max uploaded file size
export const UPLOAD_MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '2500000');
// Max files to upload
export const UPLOAD_MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES || '10');