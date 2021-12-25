const crypto = require('crypto');
const { soliditySha3, isAddress } = require('web3-utils');
const validator = require('email-validator');
const config = require('../const/config');
const emailer = require('../adapter/emailer');
const playFabAdapter = require('../adapter/playfab');
const databaseManager = require('./database_manager');
const CONST = require('../const/constants');
const logManager = require('./log_manager');

function SHA256Encryt(data) {
    const sha256 = crypto.createHash('sha256');
    sha256.update(data);

    const hash = sha256.digest('base64');
    return hash;
}

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
            const {
                StarShards: starShardBalande,
                PendingStarShards: pendingStarShardBalande,
            } = await playFabAdapter.getStarShardBalance(fabId);

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
        const amount = parseInt(req.fields.amount);

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

        const {
            StarShards: starShardBalande,
            PendingStarShards: pendingStarShardBalande,
        } = await playFabAdapter.getStarShardBalance(fabId);

        const balance = starShardBalande + pendingStarShardBalande;
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
        }

        const isPending = await databaseManager.isPendingUser(email, address);
        if (!isPending) {
            const token = SHA256Encryt(
                `${Date.now().toString()}${username}${email}${address}`
            );
            const link = `${
                config.hostName
            }/register-confirm?token=${encodeURIComponent(token)}`;
            logManager.info(
                `link: ${link}`
            );
            const callback = async (error) => {
                if (!error) {
                    const pending = await databaseManager.registerUserAsPending(
                        username,
                        email,
                        address,
                        password,
                        token
                    );
                    if (pending) {
                        response(
                            {
                                result: CONST.RET_CODE.SUCCESS,
                                msg: 'Please check email',
                                data: {
                                    link
                                }
                            },
                            res,
                            logIndex
                        );
                    } else {
                        response(
                            {
                                result: CONST.RET_CODE.FAILED,
                                msg: 'Failed to register user',
                            },
                            res,
                            logIndex
                        );
                    }
                } else {
                    response(
                        {
                            result: CONST.RET_CODE.FAILED_TO_SEND_EMAIL,
                            msg: 'Failed to send email',
                        },
                        res,
                        logIndex
                    );
                }
            }

            emailer.sendRegisterConfirm(
                username,
                email,
                address,
                link,
                callback
            );
        } else {
            response(
                {
                    result: CONST.RET_CODE.PENDING_TO_REGISTER_EMAIL_ADDRESS,
                    msg: 'Your email address is pending to register now',
                },
                res,
                logIndex
            );
        }
    });

    app.get('/register-confirm', async (req, res) => {
        const { token } = req.query;

        const logIndex = logManager.generateLogIndex();
        logManager.info(
            `index: ${logIndex}, "/register-confirm" api is called: token=${token}`
        );

        const user = await databaseManager.getPendingUserByToken(token);
        if (!user) {
            response(
                {
                    result: CONST.RET_CODE.FAILED,
                    msg: 'Failed to find pending user',
                },
                res,
                logIndex
            );
            return;
        }
        await databaseManager.removePendingUserByToken(token);
        const { username, email, address, password, tokenExpired } = user;
        if (tokenExpired) {
            response(
                {
                    result: CONST.RET_CODE.TOKEN_EXPIRED,
                    msg: 'Token expired',
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
                        msg: 'Registered successfully, please sign in.'
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
