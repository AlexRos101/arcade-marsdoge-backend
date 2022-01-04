const mailgun = require('mailgun-js');
const config = require('../const/config');
const { template } = require('../assets');
const logManager = require('../manager/log_manager');

const mg = mailgun({apiKey: config.mailgun.key, domain: config.mailgun.domain});

async function sendRegisterConfirm(username, email, address, link, callback) {
    const data = {
        // from: 'admin@arcadetoken.finance',
        // to: 'hungrywarrior081@gmail.com',
        from: "admin@arcadetoken.finance",
        to: email,
        subject: 'MarsDoge Email verification',
        html: template(link)
    };

    try {
        mg.messages().send(data, function (error, body) {
            callback(error);
        });
    } catch (error) {
        logManager.error(
            `sendRegisterConfirm failed: username=${username}, email=${email}, address=${address}, link=${link}, error=${error}`
        );
        callback(error);
    }
}

module.exports = {
    sendRegisterConfirm,
};
