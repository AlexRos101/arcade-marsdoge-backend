const express = require('express');
const cors = require('cors');
const formidableMiddleware = require('express-formidable');
const registerAPIs = require('./manager/api_manager');
const config = require('./const/config');

const app = express();
app.use(cors());
app.use(formidableMiddleware());

registerAPIs(app);

app.listen(config.portNumber, () => {
    console.log(`Server running on port: ${config.portNumber}`);
});
