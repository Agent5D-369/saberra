// Dispatcher: reads SERVICE_TYPE env var to start the correct service.
// All 3 Railway services (Worker, Dashboard, API) use the same repo and
// the same npm start command. SERVICE_TYPE controls which dist/ file runs.
const type = process.env.SERVICE_TYPE;
if (type === 'dashboard') require('./dist/dashboard/server.js');
else if (type === 'api') require('./dist/api/server.js');
else if (type === 'operator') require('./dist/operator/server.js');
else require('./dist/worker.js');
