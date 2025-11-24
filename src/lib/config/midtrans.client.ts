import midtransClient from 'midtrans-client';
import env from '../../env.js';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

export default snap;
