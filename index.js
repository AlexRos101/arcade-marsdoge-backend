const express = require('express');
const cors = require('cors');
const formidableMiddleware = require('express-formidable');
const mysql = require('mysql2/promise');
const registerAPIs = require('./manager/api_manager');
const config = require('./const/config');
const database = require('./const/database');
const syncService = require('./block_sync_service');

global.mysqlPool = mysql.createPool(database);

const app = express();
app.use(cors());
app.use(formidableMiddleware());

registerAPIs(app);

app.listen(config.portNumber, () => {
    console.log(`Server running on port: ${config.portNumber}`);
});

syncService();
