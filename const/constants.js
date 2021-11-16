const MYSQL_ERR_NO = {
    CONNECTION_ERROR: -4078,
};

const PLAYFAB_ERR_NO = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
};

const TX_TYPE = {
    MINT: 1,
    EXCHANGE: 2,
    BURN: 3,
    TRANSFER: 4,
    DEPOSIT: 5,
    WITHDRAW: 6,
};

module.exports = {
    MYSQL_ERR_NO,
    PLAYFAB_ERR_NO,
    TX_TYPE,
};
