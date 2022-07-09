import express from 'express';
import expeditions from './routes/expeditions';
import areas from './routes/areas';
import cors from 'cors';

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

export default app;
