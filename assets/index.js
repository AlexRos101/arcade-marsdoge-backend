const fs = require('fs');
const path = require('path');

const registerHTML = String(
    fs.readFileSync(path.resolve(__dirname, 'register-email.html'))
);

function registerSuccessHTML() {
    return fs.readFileSync(path.resolve(__dirname, 'register-success.html'), 'utf8').toString();
}

function template(link) {
    return registerHTML.replace('http://www.mailgun.com', link);
}

module.exports = {
    template,
    registerSuccessHTML
};
