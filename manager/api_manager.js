const { soliditySha3, isAddress } = require('web3-utils');
const validator = require('email-validator');
const config = require('../const/config');
const playFabAdapter = require('../adpater/playfab');
const databaseManager = require('./database_manager');
const CONST = require('../const/constants');

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

function responseInvalid(res) {
    const ret = {
        result: CONST.RET_CODE.INVALID_PARAMETERS,
        msg: 'validation failed!',
    };
    response(ret, res);
}

function responseFailed(res) {
    const ret = {
        result: CONST.RET_CODE.FAILED,
    };
    response(ret, res);
}

function registerAPIs(app) {
    app.post('/balance', async (req, res) => {
        const { address } = req.fields;

        if (!address) {
            responseInvalid(res);
            return;
        }

        const fabId = await databaseManager.getFabId(address);

        if (fabId === -1) {
            response(
                {
                    result: CONST.RET_CODE.NOT_REGISTERED_WALLET_ADDRESS,
                    msg: 'Not registered account.',
                },
                res
            );
            return;
        }

        playFabAdapter
            .getStarShardBalance(fabId)
            .then((balance) => {
                const ret = {
                    result: CONST.RET_CODE.SUCCESS,
                    data: {
                        balance,
                    },
                };

                response(ret, res);
            })
            .catch((err) => {
                console.log(err);
                responseFailed(res);
            });
    });

    app.post('/verify/swap-game-point', async (req, res) => {
        const { address } = req.fields;
        const { amount } = req.fields;

        const fabId = await databaseManager.getFabId(address);
        if (fabId === -1) {
            response(
                {
                    result: CONST.RET_CODE.NOT_REGISTERED_WALLET_ADDRESS,
                    msg: 'Not registered account.',
                },
                res
            );
            return;
        }

        const balance = await playFabAdapter.getStarShardBalance(fabId);
        if (balance < amount) {
            response(
                {
                    result: CONST.RET_CODE.INSUFFICIANT_BALANCE,
                    msg: 'Insufficient balance.',
                },
                res
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

        response(ret, res);
    });

    app.post('/register', (req, res) => {
        const { username } = req.fields;
        const { email } = req.fields;
        const { address } = req.fields;
        const { password } = req.fields;

        if (
            !username ||
            !validator.validate(email) ||
            !isAddress(address) ||
            !password
        ) {
            responseInvalid(res);
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

                let ret;
                if (result) {
                    ret = {
                        result: CONST.RET_CODE.SUCCESS,
                        data: {
                            fabId: fabResponse.PlayFabId,
                        },
                    };

                    response(ret, res);
                } else {
                    responseFailed(res);
                }
            })
            .catch((err) => {
                console.log(err);
                responseFailed(res);
            });
    });

    app.post('/verify/address', async (req, res) => {
        const { address } = req.fields;

        if (!isAddress(address)) {
            responseInvalid(res);
            return;
        }

        const ret = {
            result: CONST.RET_CODE.FAILED,
        };

        const fabId = await databaseManager.getFabId(address);
        if (fabId !== -1) {
            ret.result = CONST.RET_CODE.SUCCESS;
        }

        response(ret, res);
    });
}

module.exports = registerAPIs;
