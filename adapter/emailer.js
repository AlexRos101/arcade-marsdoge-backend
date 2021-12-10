const sgMail = require('@sendgrid/mail');
const config = require('../const/config');
const { template } = require('../assets');
const logManager = require('../manager/log_manager');

sgMail.setApiKey(config.sendGrid.key);

async function sendRegisterConfirm(username, email, address, link) {
    const emailObj = {
        to: email,
        from: config.sendGrid.sender,
        subject: 'MarsDoge Email verification',
        html: template(link),
    };

    try {
        const response = await sgMail.send(emailObj);
        if (response.length > 0 && response[0].statusCode === 202) {
            logManager.error(
                `sendRegisterConfirm sent: username=${username}, email=${email}, address=${address}, link=${link}`
            );

            return true;
        }
    } catch (error) {
        logManager.error(
            `sendRegisterConfirm failed: username=${username}, email=${email}, address=${address}, link=${link}, error=${error}`
        );
    }
    return false;
}

module.exports = {
    sendRegisterConfirm,
};
