const log4js = require('log4js');

log4js.configure({
    replaceConsole: true,
    appenders: {
        GameBackend: {
            //  set the type as dateFile
            type: 'dateFile',
            //  configuration file name myLog.log
            filename: 'logs/logs.log',
            //  specifies the encoding format as utf-8
            encoding: 'utf-8',
            //  log files by date （ day ） cutting
            pattern: 'yyyy-MM-dd',
            //  when rolling back old log files, make sure to  .log  at the end
            keepFileExt: true,
            //  the output log file name is always included pattern  end date
            alwaysIncludePattern: true,
        },
    },
    categories: {
        //  set default categories
        default: { appenders: ['GameBackend'], level: 'debug' },
    },
});

const logger = log4js.getLogger('GameBackend');

function info(msg) {
    console.log(msg);
    logger.level = 'info';
    logger.info(msg);
}

function error(msg) {
    console.log(msg);
    logger.level = 'error';
    logger.error(msg);
}

function warn(msg) {
    console.log(msg);
    logger.level = 'warn';
    logger.warn(msg);
}

const startIndex = Math.floor(Date.now() / 1000) * 1000;
let lastIndex = startIndex;

function generateLogIndex() {
    lastIndex += 1;
    return lastIndex;
}

module.exports = {
    info,
    error,
    warn,
    generateLogIndex,
};
