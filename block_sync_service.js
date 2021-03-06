const arcadeDogeBackendAdapter = require('./adapter/arcade_backend');
const playfabAdapter = require('./adapter/playfab');
const databaseManager = require('./manager/database_manager');
const CONST = require('./const/constants');
const config = require('./const/config');
const logManager = require('./manager/log_manager');

async function syncTxs() {
    logManager.info('Sycnronizing Txs');

    try {
        const syncIndex = await databaseManager.getSyncIndex();
        if (syncIndex === -1) throw new Error('Getting sync index failed.');

        const txs = await arcadeDogeBackendAdapter.getTxs(syncIndex);
        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];

            const fabId = await databaseManager.getFabId(tx.from_address);

            if (tx.tx_type === CONST.TX_TYPE.DEPOSIT) {
                if (fabId === -1 || fabId === false) {
                    throw new Error('Not exist playfab user');
                }

                const { PendingStarShards } =
                    await playfabAdapter.getStarShardBalance(fabId);
                await playfabAdapter.setPendingStarShardBalance(
                    fabId,
                    PendingStarShards + tx.amount
                );
            } else if (tx.tx_type === CONST.TX_TYPE.WITHDRAW) {
                if (fabId === -1) throw new Error('Not exist playfab user');

                const {
                    StarShards: starShardBalande,
                    PendingStarShards: pendingStarShardBalande,
                } = await playfabAdapter.getStarShardBalance(fabId);
        
                const balance = starShardBalande + pendingStarShardBalande;
                
                if (balance >= tx.amount) {
                    await playfabAdapter.setPendingStarShardBalance(
                        fabId,
                        pendingStarShardBalande - tx.amount
                    );
                }
            }

            await databaseManager.sync(tx);
        }
    } catch (err) {
        logManager.error(err);
    }

    logManager.info('Synchronizing Txs completed.');

    setTimeout(() => {
        syncTxs();
    }, config.serviceDelay);
}

module.exports = syncTxs;
