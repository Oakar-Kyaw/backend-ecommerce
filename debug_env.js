const { envConfig } = require('./dist/libs/config/envConfig');
// We need to build first or use ts-node
// Let's try to just read process.env directly in a script that loads .env
require('dotenv').config();

console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD);
