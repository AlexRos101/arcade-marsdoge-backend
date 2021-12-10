const fs = require('fs');
const path = require('path');

const registerHTML = String(
    fs.readFileSync(path.resolve(__dirname, 'register-email.html'))
);

function template(link) {
    return registerHTML.replace('http://htmlemail.io', link);
}

module.exports = {
    template,
};
