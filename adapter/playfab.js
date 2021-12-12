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
                const starShards = res.Statistics.filter(
                    (stats) =>
                        stats.StatisticName === config.starShardBalanceField
                );
                const pendingStarShards = res.Statistics.filter(
                    (stats) =>
                        stats.StatisticName ===
                        config.pendingStarShardBalanceField
                );

                resolve({
                    StarShards:
                        starShards.length > 0 ?
                            parseInt(starShards[0].Value) :
                            null,
                    PendingStarShards:
                        pendingStarShards.length > 0 ?
                            parseInt(pendingStarShards[0].Value) :
                            null,
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
}

function setPendingStarShardBalance(fabId, balance) {
    return new Promise((resolve, reject) => {
        sendPost('/Server/UpdatePlayerStatistics', {
            PlayFabId: fabId,
            Statistics: [
                {
                    StatisticName: config.pendingStarShardBalanceField,
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
    setPendingStarShardBalance,
};
