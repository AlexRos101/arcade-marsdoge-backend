const { soliditySha3, isAddress } = require('web3-utils');
const validator = require('email-validator');
const config = require('../const/config');
const playFabAdapter = require('../adpater/playfab');
const databaseManager = require('./database_manager');

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

function responseInvalid(res) {
    const ret = {
        result: false,
        msg: 'validation failed!',
    };
    response(ret, res);
}

function responseFailed(res) {
    const ret = {
        result: false,
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
            responseInvalid(res);
            return;
        }

        playFabAdapter
        .getStarShardBalance(fabId)
        .then((balance) => {
            const ret = {
                result: 1,
                data: {
                    balance: balance,
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

        const gameSign = soliditySha3(
            config.gameID,
            address.toLowerCase(),
            parseInt(amount, 10),
            soliditySha3(config.backendKey)
        );

        const ret = {
            result: 1,
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

            const ret = {
                result,
                data: {
                    fabId: fabResponse.PlayFabId,
                },
            };

            response(ret, res);
        })
        .catch((err) => {
            console.log(err);
            responseFailed(res);
        });
    });
}

module.exports = registerAPIs;
