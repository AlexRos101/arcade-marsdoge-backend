const { soliditySha3, isAddress } = require("web3-utils");
const config = require('../const/config');

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

function validateEmail(emailAdress) {
    let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (emailAdress.match(regexEmail)) {
        return true; 
    } else {
        return false; 
    }
}

function registerAPIs(app) {
    app.post('/balance', async (req, res) => {
        const address = req.fields.address;

        const ret = {
            result: 1,
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
            parseInt(amount, 10),
            soliditySha3(config.backendKey)
          );

        const ret = {
            result: 1,
            data: {
                verification_token: gameSign
            },
        };

        response(ret, res);
    });

    app.post('/register', async (req, res) => {
        const username = req.fields.username;
        const email = req.fields.email;
        const address = req.fields.address;

        if (!username || !validateEmail(email) || !isAddress(address)) {
            responseInvalid(res);
            return;
        }

        const ret = {
            result: true,
            data: {
                fabId: '1'
            }
        };

        response(ret, res);
    });
}

module.exports = registerAPIs;