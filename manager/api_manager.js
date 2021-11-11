const { soliditySha3 } = require("web3-utils");
const config = require('../const/config');

function registerAPIs(app) {
    app.post('/balance', async (req, res) => {
        const address = req.fields.address;

        const ret = {
            result: true,
            data: {
                balance: 220
            },
        };

        response(ret, res);
    });

    app.post('/verify/swap-game-point', async (req, res) => {
        const address = req.fields.address;
        const amount = req.fields.amount;

        const gameSign = soliditySha3(
            config.gameID,
            address.toLowerCase(),
            amount,
            soliditySha3(config.backendKey)
          );

        const ret = {
            result: true,
            data: {
                verification_token: gameSign
            },
        };

        response(ret, res);
    });
}

function response(ret, res) {
    res.setHeader('content-type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200);
    res.json(ret);
}

module.exports = registerAPIs;