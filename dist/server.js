import app from './app.js';
import env from './env.js';
// start the server
app.listen(env.PORT, () => {
    console.log(`[⚡SERVER ] Server is running at http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});
