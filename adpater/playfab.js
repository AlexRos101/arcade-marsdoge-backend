const axios = require('axios');
const config = require('../const/config');
const CONST = require('../const/constants');

function sendPost(requestUrl, params) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: config.playfabUrl + requestUrl,
            data: params,
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => {
                if (response.data.code === CONST.PLAYFAB_ERR_NO.SUCCESS) {
                    resolve(response.data.data);
                } else {
                    reject(new Error('Validation Error.'));
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function registerUser(username, email, password) {
    return new Promise((resolve, reject) => {
        sendPost('/Client/RegisterPlayFabUser', {
            TitleId: config.titleId,
            DisplayName: username,
            Email: email,
            Password: password,
            PlayerSecret: config.secretKey,
            Username: username,
        })
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

module.exports = {
    registerUser,
};
