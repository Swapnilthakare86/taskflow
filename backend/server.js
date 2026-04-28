'use strict';
require('dotenv').config();
const app = require('./src/app');
const { PORT } = require('./src/config/env');

const port = PORT || 5000;

app.listen(port, () => {
  console.log(`TaskFlow API running on http://localhost:${port}`);
  console.log(`    Environment : ${process.env.NODE_ENV || 'development'}`);
});
