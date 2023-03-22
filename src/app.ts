import express from 'express';
import expeditions from './routes/expeditions';
import areas from './routes/areas';
import warehouse from './routes/warehouses';
import cors from 'cors';
import connection from './database';

// initializations
const app = express();

// settings
app.set('port', process.env.PORT || 8080);

// middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/expeditions', expeditions);
app.use('/areas', areas);
app.use('/warehouse', warehouse);
connection;

export default app;
