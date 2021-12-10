const config = {
    hostName: 'http://localhost:5000', // this value will be used to make the link for registration email
    portNumber: 5000,

    backendKey: 'GameBackend',
    gameID: 1,

    secretKey: 'BEYQHQXD8SZ7T1INX19BAXHZMCRC6C7U1ZMEI9SWJ1PZZP7TNJ',
    titleId: 'AF783',

    playfabUrl: 'https://AF783.playfabapi.com',

    starShardBalanceField: 'realStarShards',
    pendingStarShardBalanceField: 'pendingStarShards',

    arcadeDogeBackendUrl: 'http://localhost:4000',
    arcadeDogeSyncCnt: 1000,

    serviceDelay: 5000,

    sendGrid: {
        key: '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',
        sender: 'marsdoge@arcadetoken.finance',
    },
};

module.exports = config;
