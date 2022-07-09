import mongoose from 'mongoose';

import config from './config/config';

mongoose.connect(config.DB.URI);

const connection = mongoose.connection;

connection.once('open', async () => {
  console.log('Mongodb connection established');
});

connection.on('error', (err) => {
  console.log(err);
  process.exit(0);
});

export default connection;
