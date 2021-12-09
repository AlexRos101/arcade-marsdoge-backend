const CONST = require('../const/constants');
const logManager = require('./log_manager');

async function connect() {
    return new Promise((resolve, reject) => {
        global.mysqlPool
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

async function registerUserAsPending(
    username,
    email,
    address,
    password,
    token
) {
    let connection = null;

    try {
        connection = await connect();

        await startTransactions(connection);

        const query =
            'INSERT INTO tbl_pending_user (username, password, email, token, address, expired) VALUE (?, ?, ?, ?, ?, ADDDATE(NOW(), 3))';
        await mysqlExecute(connection, query, [
            username,
            password,
            email,
            token,
            address,
        ]);

        await commitTransaction(connection);
        connection.release();

        return token;
    } catch (err) {
        logManager.error(
            `registerUserAsPending failed: username=${username}, email=${email}, address=${address}`
        );
        await onConnectionErr(connection, err, true);
    }

    return false;
}

async function isPendingUser(email, address) {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT token FROM tbl_pending_user WHERE address = ? AND expired > now()';

        const [rows] = await mysqlExecute(connection, query, [address]);

        connection.release();

        if (rows.length !== 0) {
            return true;
        }
    } catch (err) {
        logManager.error(
            `isPendingUser failed: email=${email} address=${address}`
        );
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function getPendingUserByToken(token) {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT username, password, email, address, expired FROM tbl_pending_user WHERE token = ? AND expired > now()';

        const [rows] = await mysqlExecute(connection, query, [token]);

        connection.release();

        if (rows.length !== 0) {
            return {
                username: rows[0].username,
                password: rows[0].password,
                email: rows[0].email,
                address: rows[0].address,
                tokenExpired: new Date(rows[0].expired) <= Date.now(),
            };
        }

        return null;
    } catch (err) {
        logManager.error(`getPendingUserByToken failed: token=${token}`);
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function removePendingUserByToken(token) {
    let connection = null;

    try {
        connection = await connect();

        await startTransactions(connection);
        const query = 'DELETE FROM tbl_pending_user WHERE token = ?';
        await mysqlExecute(connection, query, [token]);
        await commitTransaction(connection);

        connection.release();
    } catch (err) {
        logManager.error(`removePendingUserByToken failed: token=${token}`);
        await onConnectionErr(connection, err, true);
    }
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

        return -1;
    } catch (err) {
        logManager.error(`getFabId failed: address=${address}`);
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function getUserByAddress(address) {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT username, email, fab_id, address, created_at FROM tbl_user WHERE address = ?';

        const [rows] = await mysqlExecute(connection, query, [address]);

        connection.release();

        if (rows.length !== 0) {
            return {
                username: rows[0].username,
                email: rows[0].email,
                fabId: rows[0].fab_id,
                address: rows[0].address,
                createdAt: rows[0].created_at,
            };
        }

        return null;
    } catch (err) {
        logManager.error(`getUserByAddress failed: address=${address}`);
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function getUserByEmail(email) {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT username, email, fab_id, address, created_at FROM tbl_user WHERE email = ?';

        const [rows] = await mysqlExecute(connection, query, [email]);

        connection.release();

        if (rows.length !== 0) {
            return {
                username: rows[0].username,
                email: rows[0].email,
                fabId: rows[0].fab_id,
                address: rows[0].address,
                createdAt: rows[0].created_at,
            };
        }

        return null;
    } catch (err) {
        logManager.error(`getUserByEmail failed: email=${email}`);
        await onConnectionErr(connection, err, false);
    }

    return false;
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
    registerUserAsPending,
    isPendingUser,
    getPendingUserByToken,
    removePendingUserByToken,
    getFabId,
    getUserByAddress,
    getUserByEmail,
    getSyncIndex,
    updateSyncIndex,
};
