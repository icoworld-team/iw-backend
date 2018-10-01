import * as path from 'path';

// Verify contract URL.
export const verifyContractLink = process.env.ETH_VERIFY_CONTRACT_URL || 'https://etherscan.io/verifyContract';
// The path for serving static files.
export const STATIC_ROOT = path.join(process.env.STATIC_PATH || process.cwd(),'static');
// Session keys value.
export const SESSION_KEYS = process.env.SESSION_KEYS || '97Jix8Mcc4G+CD02iunYB6sZTjXxQfks'
// Max uploaded file size
export const UPLOAD_MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '2500000');
// Max files to upload
export const UPLOAD_MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES || '10');