import admin from 'firebase-admin';
import env from '../../env.js';
const base64 = env.FIREBASE_SERVICE_ACCOUNT;
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
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
});
export default admin;
