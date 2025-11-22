"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const base64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!base64) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable');
}
let jsonString;
let serviceAccount;
try {
    jsonString = Buffer.from(base64, 'base64').toString('utf8');
}
catch (err) {
    console.error('❌ Failed to decode Base64 service account:', err);
    throw err;
}
try {
    serviceAccount = JSON.parse(jsonString);
}
catch (err) {
    console.error('❌ Failed to parse service account JSON:', jsonString);
    throw err;
}
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
});
exports.default = firebase_admin_1.default;
