const axios = require('axios');
const config = require('../const/config');
const CONST = require('../const/constants');

function sendPost(requestUrl, params) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: config.arcadeDogeBackendUrl + requestUrl,
            data: params,
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (response.data.result === CONST.RET_CODE.SUCCESS) {
                    resolve(response.data.data);
                } else {
                    reject(new Error('Getting txs failed.'));
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function getTxs(index) {
    return new Promise((resolve, reject) => {
        sendPost('/sync/txs', {
            game_id: config.gameID,
            index,
            count: config.arcadeDogeSyncCnt,
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
    getTxs,
};
