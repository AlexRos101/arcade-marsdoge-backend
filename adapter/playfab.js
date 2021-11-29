const axios = require('axios');
const config = require('../const/config');
const CONST = require('../const/constants');

function sendPost(requestUrl, params) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: config.playfabUrl + requestUrl,
            data: params,
            headers: {
                'Content-Type': 'application/json',
                'X-SecretKey': config.secretKey,
            },
        })
            .then((response) => {
                if (response.data.code === CONST.PLAYFAB_ERR_NO.SUCCESS) {
                    resolve(response.data.data);
                } else {
                    reject(new Error(response.data.data.errorMessage));
                }
            })
            .catch((error) => {
                if (error.response.data.errorMessage) {
                    reject(new Error(error.response.data.errorMessage));
                } else {
                    reject(error);
                }
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

function getStarShardBalance(fabId) {
    return new Promise((resolve, reject) => {
        sendPost('/Server/GetPlayerStatistics', {
            PlayFabId: fabId,
        })
            .then((res) => {
                let balance = 0;
                for (let i = 0; i < res.Statistics.length; i++) {
                    if (
                        res.Statistics[i].StatisticName ===
                        config.starShardBalanceField
                    ) {
                        balance = res.Statistics[i].Value;
                        break;
                    }
                }
                resolve(balance);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

function setStarShardBalance(fabId, balance) {
    return new Promise((resolve, reject) => {
        sendPost('/Server/UpdatePlayerStatistics', {
            PlayFabId: fabId,
            Statistics: [
                {
                    StatisticName: 'StarShardCount',
                    Value: balance,
                },
            ],
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
    getStarShardBalance,
    setStarShardBalance,
};
