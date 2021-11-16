const CONST = require('../const/constants');

/* eslint-disable */
async function connect() {
    return new Promise((resolve, reject) => {
        mysqlPool
            .getConnection()
            .then((connection) => {
                resolve(connection);
            })
            .catch((err) => {
                console.log(err);
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
    console.log(err);
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
        await onConnectionErr(connection, err, true);
    }

    return ret;
}

async function getFabId(address) {
    let connection = null;

    try {
        connection = await connect();

        const query = 'SELECT fab_id FROM tbl_user WHERE address = ?';

        let [rows] = await mysqlExecute(connection, query, [address]);

        if (rows.length == 0) return -1;
        return rows[0].fab_id;
    } catch (err) {
        await onConnectionErr(connection, err, true);
    }

    return -1;
}

module.exports = {
    registerUser,
    getFabId
};
