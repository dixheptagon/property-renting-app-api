import express, { Request, Response, Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { requestLogger } from './lib/middlewares/request.logger';
import { errorMiddleware } from './lib/middlewares/error.handler';

// setup express
const app: Application = express();

// setup middleware : CORS
app.use(cors()); // Semua client dapat mengakses API kita

// setup middleware: body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// setup middleware: LOGGING
app.use(requestLogger);

// expose public folder
app.use('/public', express.static('public'));

// setup middleware: CORS (Cross-Origin Resource Sharing)

// define root routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Express server!',
  });
});

// import routers

import authRouter from './routers/auth/auth.route';

// use user router

const routers = [authRouter];
routers.forEach((router) => {
  app.use('/api', router);
});

// setup error handler middleware
app.use(errorMiddleware);

// export app for server
export default app;
