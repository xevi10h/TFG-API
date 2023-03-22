import app from './app';
import './database';
import * as dotenv from 'dotenv';

dotenv.config();
app.listen(app.get('port'));
console.log(`Server on port ${app.get('port')}`);
