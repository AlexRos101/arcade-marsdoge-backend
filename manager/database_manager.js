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
            'SELECT username, password, email, address, expired FROM tbl_pending_user WHERE token = ?';

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

async function txSynchronized(txid) {
    let connection = null;

    try {
        connection = await connect();

        const query = 'SELECT id FROM tbl_history WHERE txid = ?';

        const [rows] = await mysqlExecute(connection, query, [txid]);

        connection.release();

        if (rows.length !== 0) {
            return true;
        }

        return false;
    } catch (err) {
        logManager.error(`txSynchronized failed: txid=${txid}`);
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

async function updateSyncIndex(connection, syncIndex) {
    let res = false;

    try {
        const query = 'UPDATE tbl_status SET sync_index = ? WHERE id = 1';
        const [rows] = await mysqlExecute(connection, query, [syncIndex]);

        res = rows.affectRows > 0;
    } catch (err) {
        logManager.error(`updateSyncIndex failed: syncIndex=${syncIndex}`);
    }
    return res;
}

async function addSyncTx(connection, tx) {
    let res = false;

    try {
        const query = 'INSERT INTO tbl_history (sync_index, txid) VALUE(?, ?)';
        const [rows] = await mysqlExecute(connection, query, [tx.id, tx.txid]);

        res = rows.insertId > 0;
    } catch (err) {
        logManager.error(`addSyncTx failed: syncIndex=${tx.id}`);
    }
    return res;
}

async function sync(tx) {
    let connection = null;
    let res = false;

    try {
        connection = await connect();
        if (!await addSyncTx(connection, tx)) {
            throw new Error('Adding sync tx failed.');
        }

        if (!await updateSyncIndex(connection, tx.id)) {
            throw new Error('Updating sync index failed.');
        }

        await commitTransaction(connection);

        connection.release();
        res = true;
    } catch (err) {
        logManager.error(`addSyncTx failed: tx=${JSON.stringify(tx)}`);
        await onConnectionErr(connection, err, true);
    }

    return res;
}

async function getGameVersion() {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT value FROM tbl_game_setting WHERE category LIKE ? AND kind LIKE ?';

        const [rows] = await mysqlExecute(connection, query, ['Game', 'Version']);

        connection.release();

        if (rows.length !== 0) {
            return rows[0].value;
        }

        return null;
    } catch (err) {
        logManager.error('getGameVersion failed');
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function getPlantCycle() {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT kind, value FROM tbl_game_setting WHERE category LIKE ?';

        const [rows] = await mysqlExecute(connection, query, ['PlantCycle']);

        connection.release();

        if (rows.length !== 0) {
            const plantCycle = {};
            rows.forEach(row => {
                plantCycle[row.kind] = parseInt(row.value);
            });
            return plantCycle;
        }

        return null;
    } catch (err) {
        logManager.error('getPlantCycle failed');
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function getYieldRewards() {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT kind, value FROM tbl_game_setting WHERE category LIKE ?';

        const [rows] = await mysqlExecute(connection, query, ['YieldRewards']);

        connection.release();

        if (rows.length !== 0) {
            const yieldRewards = {};
            rows.forEach(row => {
                yieldRewards[row.kind] = parseInt(row.value);
            });
            return yieldRewards;
        }

        return null;
    } catch (err) {
        logManager.error('getYieldRewards failed');
        await onConnectionErr(connection, err, false);
    }

    return false;
}

async function getItemPrices() {
    let connection = null;

    try {
        connection = await connect();

        const query =
            'SELECT kind, value FROM tbl_game_setting WHERE category LIKE ?';

        const [rows] = await mysqlExecute(connection, query, ['ItemPrices']);

        connection.release();

        if (rows.length !== 0) {
            const itemPrices = {};
            rows.forEach(row => {
                itemPrices[row.kind] = parseInt(row.value);
            });
            return itemPrices;
        }

        return null;
    } catch (err) {
        logManager.error('getItemPrices failed');
        await onConnectionErr(connection, err, false);
    }

    return false;
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
    txSynchronized,
    sync,
    getGameVersion,
    getPlantCycle,
    getYieldRewards,
    getItemPrices
};
