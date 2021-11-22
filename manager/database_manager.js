const CONST = require('../const/constants');
const logManager = require('./log_manager');

/* eslint-disable */
async function connect() {
    return new Promise((resolve, reject) => {
        mysqlPool
            .getConnection()
            .then((connection) => {
                resolve(connection);
            })
            .catch((err) => {
                logManager.error(err);
                reject(err);
            });
    });
}
/* eslint-enable */

async function startTransactions(connection) {
    const query = 'START TRANSACTION';
    await connection.query(query);
}

async function commitTransaction(connection) {
    const query = 'COMMIT';
    await connection.query(query);
}

async function rollbackTransaction(connection) {
    const query = 'ROLLBACK';
    await connection.query(query);
}

async function onConnectionErr(connection, err, isRollBack = false) {
    logManager.error(JSON.stringify(err));
    if (connection == null) return;
    if (err.errono === CONST.MYSQL_ERR_NO.CONNECTION_ERROR) return;
    if (isRollBack) await rollbackTransaction(connection);
    connection.release();
}

async function mysqlExecute(connection, query, params = []) {
    // let stringify_params = [];
    // for (let i = 0; i < params.length; i++) {
    //     stringify_params.push(params[i].toString());
    // }

    return await connection.query(query, params);
}

async function registerUser(username, email, address, fabId) {
    let connection = null;
    let ret = false;

    try {
        connection = await connect();

        await startTransactions(connection);

        const query =
            'INSERT INTO tbl_user (username, email, fab_id, address) ' +
            'VALUE (?, ?, ?, ?)';
        const [rows] = await mysqlExecute(connection, query, [
            username,
            email,
            fabId,
            address,
        ]);

        await commitTransaction(connection);
        ret = rows.insertId > 0;
        connection.release();
    } catch (err) {
        logManager.error(
            `registerUser failed: username=${username}, email=${email}, address=${address}, fabId=${fabId}`
        );
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function getFabId(address) {
    let connection = null;

    try {
        connection = await connect();

        const query = 'SELECT fab_id FROM tbl_user WHERE address = ?';

        const [rows] = await mysqlExecute(connection, query, [address]);

        connection.release();

        if (rows.length !== 0) {
            return rows[0].fab_id;
        }
    } catch (err) {
        logManager.error(`getFabId failed: address=${address}`);
        await onConnectionErr(connection, err, false);
    }

    return -1;
}

async function getSyncIndex() {
    let connection = null;

    try {
        connection = await connect();

        const query = 'SELECT sync_index FROM tbl_status WHERE id = 1';
        const [rows] = await mysqlExecute(connection, query, []);

        connection.release();

        if (rows.length !== 0) {
            return rows[0].sync_index;
        }
    } catch (err) {
        logManager.error('getSyncIndex failed: no parameters');
        await onConnectionErr(connection, err, false);
    }
    return -1;
}

async function updateSyncIndex(syncIndex) {
    let connection = null;
    let res = false;

    try {
        connection = await connect();

        await startTransactions(connection);
        const query = 'UPDATE tbl_status SET sync_index = ? WHERE id = 1';
        const [rows] = await mysqlExecute(connection, query, [syncIndex]);
        await commitTransaction(connection);

        connection.release();

        res = rows.affectRows > 0;
    } catch (err) {
        logManager.error(`updateSyncIndex failed: syncIndex=${syncIndex}`);
        await onConnectionErr(connection, err, true);
    }
    return res;
}

module.exports = {
    registerUser,
    getFabId,
    getSyncIndex,
    updateSyncIndex,
};
