const arcadeDogeBackendAdapter = require('./adpater/arcade_backend');
const playfabAdapter = require('./adpater/playfab');
const databaseManager = require('./manager/database_manager');
const CONST = require('./const/constants');
const config = require('./const/config');

async function syncTxs() {
    console.log('Sycnronizing Txs');

    try {
        const syncIndex = await databaseManager.getSyncIndex();
        if (syncIndex === -1) throw new Error('Getting sync index failed.');

        const txs = await arcadeDogeBackendAdapter.getTxs(syncIndex);
        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];

            const fabId = await databaseManager.getFabId(tx.from_address);

            if (tx.tx_type === CONST.TX_TYPE.DEPOSIT) {
                if (fabId === -1) throw new Error('Not exist playfab user');

                const balance = await playfabAdapter.getStarShardBalance(fabId);
                await playfabAdapter.setStarShardBalance(
                    fabId,
                    balance + tx.amount
                );
            } else if (tx.tx_type === CONST.TX_TYPE.WITHDRAW) {
                if (fabId === -1) throw new Error('Not exist playfab user');

                const balance = await playfabAdapter.getStarShardBalance(fabId);
                await playfabAdapter.setStarShardBalance(
                    fabId,
                    balance - tx.amount
                );
            } else {
            }

            await databaseManager.updateSyncIndex(tx.id);
        }
    } catch (err) {
        console.log(err);
    }

    console.log('Synchronizing Txs completed.');

    setTimeout(() => {
        syncTxs();
    }, config.serviceDelay);
}

module.exports = syncTxs;
