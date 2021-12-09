const { soliditySha3, isAddress } = require('web3-utils');
const validator = require('email-validator');
const config = require('../const/config');
const playFabAdapter = require('../adapter/playfab');
const databaseManager = require('./database_manager');
const CONST = require('../const/constants');
const logManager = require('./log_manager');

function response(ret, res, logIndex) {
    logManager.info(`index: ${logIndex}, ${JSON.stringify(ret)}`);

    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

function responseInvalid(res, logIndex) {
    const ret = {
        result: CONST.RET_CODE.INVALID_PARAMETERS,
        msg: 'validation failed!',
    };
    response(ret, res, logIndex);
}

function responseFailed(res, logIndex, msg = undefined) {
    if (msg) {
        response(
            {
                result: CONST.RET_CODE.FAILED,
                msg,
            },
            res,
            logIndex
        );
    } else {
        response(
            {
                result: CONST.RET_CODE.FAILED,
            },
            res,
            logIndex
        );
    }
}

function registerAPIs(app) {
    app.post('/balance', async (req, res) => {
        const { address } = req.fields;

        const logIndex = logManager.generateLogIndex();
        logManager.info(
            `index: ${logIndex}, "/balance" api is called: address=${address}`
        );

        if (!address) {
            responseInvalid(res, logIndex);
            return;
        }

        const fabId = await databaseManager.getFabId(address);
        if (fabId === false) {
            response(
                {
                    result: CONST.RET_CODE.FAILED,
                    msg: 'Failed to check if user exists',
                },
                res,
                logIndex
            );
            return;
        }

        if (fabId === -1) {
            response(
                {
                    result: CONST.RET_CODE.NOT_REGISTERED_WALLET_ADDRESS,
                    msg: 'Not registered account.',
                },
                res,
                logIndex
            );
            return;
        }

        try {
            const starShardBalande = await playFabAdapter.getStarShardBalance(
                fabId
            );
            const pendingStarShardBalande =
                await playFabAdapter.getPendingStarShardBalance(fabId);

            const balance = starShardBalande + pendingStarShardBalande;
            const ret = {
                result: CONST.RET_CODE.SUCCESS,
                data: {
                    balance,
                },
            };

            response(ret, res, logIndex);
        } catch (err) {
            logManager.error(`index: ${logIndex}, ${JSON.stringify(err)}`);
            responseFailed(res, logIndex, err.message);
        }
    });

    app.post('/verify/swap-game-point', async (req, res) => {
        const { address } = req.fields;
        const { amount } = req.fields;

        const logIndex = logManager.generateLogIndex();
        logManager.info(
            `index: ${logIndex}, "/verify/swap-game-point" api is called: address=${address} amount=${amount}`
        );

        const fabId = await databaseManager.getFabId(address);
        if (fabId === false) {
            response(
                {
                    result: CONST.RET_CODE.FAILED,
                    msg: 'Failed to check if user exists',
                },
                res,
                logIndex
            );
            return;
        }

        if (fabId === -1) {
            response(
                {
                    result: CONST.RET_CODE.NOT_REGISTERED_WALLET_ADDRESS,
                    msg: 'Not registered account.',
                },
                res,
                logIndex
            );
            return;
        }

        let balance = await playFabAdapter.getStarShardBalance(fabId);
        const pendingBalance = await playFabAdapter.getPendingStarShardBalance(
            fabId
        );
        balance += pendingBalance;
        if (balance < amount) {
            response(
                {
                    result: CONST.RET_CODE.INSUFFICIANT_BALANCE,
                    msg: 'Insufficient balance.',
                },
                res,
                logIndex
            );
            return;
        }

        const gameSign = soliditySha3(
            config.gameID,
            address.toLowerCase(),
            parseInt(amount, 10),
            soliditySha3(config.backendKey)
        );

        const ret = {
            result: CONST.RET_CODE.SUCCESS,
            data: {
                verification_token: gameSign,
            },
        };

        response(ret, res, logIndex);
    });

    app.post('/register', async (req, res) => {
        const { username } = req.fields;
        const { email } = req.fields;
        const { address } = req.fields;
        const { password } = req.fields;

        const logIndex = logManager.generateLogIndex();
        logManager.info(
            `index: ${logIndex}, "/register" api is called: username=${username} email=${email} ` +
                `address=${address} password=${password}`
        );

        if (
            !username ||
            !validator.validate(email) ||
            !isAddress(address) ||
            !password
        ) {
            responseInvalid(res, logIndex);
            return;
        }

        const user = await databaseManager.getUserByAddress(address);
        const user2 = await databaseManager.getUserByEmail(email);
        if (user === false || user2 === false) {
            response(
                {
                    result: CONST.RET_CODE.FAILED,
                    msg: 'Failed to check if user exists',
                },
                res,
                logIndex
            );
            return;
        }
        if (user !== null) {
            response(
                {
                    result: CONST.RET_CODE.DUPLICATE_WALLET_ADDRESS,
                    msg: 'Duplicated wallet address',
                },
                res,
                logIndex
            );
            return;
        }
        if (user2 != null) {
            response(
                {
                    result: CONST.RET_CODE.DUPLICATE_EMAIL_ADDRESS,
                    msg: 'Duplicated email address',
                },
                res,
                logIndex
            );
            return;
        }

        playFabAdapter
            .registerUser(username, email, password)
            .then(async (fabResponse) => {
                const result = await databaseManager.registerUser(
                    username,
                    email,
                    address,
                    fabResponse.PlayFabId
                );

                if (result) {
                    const ret = {
                        result: CONST.RET_CODE.SUCCESS,
                        data: {
                            fabId: fabResponse.PlayFabId,
                        },
                    };

                    response(ret, res, logIndex);
                } else {
                    responseFailed(res, logIndex);
                }
            })
            .catch((err) => {
                logManager.error(`index: ${logIndex}, ${JSON.stringify(err)}`);
                responseFailed(res, logIndex, err.message);
            });
    });

    app.post('/verify/address', async (req, res) => {
        const { address } = req.fields;

        const logIndex = logManager.generateLogIndex();
        logManager.info(
            `index: ${logIndex}, "/verify/address" api is called: address=${address}`
        );

        if (!isAddress(address)) {
            responseInvalid(res, logIndex);
            return;
        }

        const ret = {
            result: CONST.RET_CODE.FAILED,
        };

        const fabId = await databaseManager.getFabId(address);
        if (fabId === false) {
            response(
                {
                    result: CONST.RET_CODE.FAILED,
                    msg: 'Failed to check if user exists',
                },
                res,
                logIndex
            );
            return;
        }

        if (fabId !== -1) {
            ret.result = CONST.RET_CODE.SUCCESS;
        }

        response(ret, res, logIndex);
    });
}

module.exports = registerAPIs;
