import Datastore from 'nedb'

const os = require('os')
import path from 'path'
import {ipcMain} from "electron";

const setting = () => {
    return {
        autoOpenWindow: false, downloadPath: '', kafka: {
            requestTimeout: 30000, enforceRequestTimeout: false, retry: {
                maxRetryTime: 30000, initialRetryTime: 300, factor: 0.2, multiplier: 2, retries: 5
            }, authenticationTimeout: 10000, reauthenticationThreshold: 10000
        }, topic: {
            validateOnly: false, waitForLeaders: true, timeout: 5000,
        }
    };
}
const settings = new Datastore({
    autoload: true, filename: path.join(os.homedir(), 'kafka-visark', 'data', 'settings.db')
})
/**
 * 插入
 * @param value
 * @returns {Promise<unknown>}
 */
const insert = async (value) => {
    return new Promise((resolve, reject) => {
        value._id = "1";
        settings.insert(value, (err, doc) => {
            if (err) {
                reject(err);
            } else {
                resolve(doc);
            }
        })
    })
}
/**
 * 更新
 * @param value
 * @returns {Promise<unknown>}
 */
const update = async (value) => {
    return new Promise((resolve, reject) => {
        let target = Object.assign({}, value)
        delete target._id
        settings.update({_id: "1"}, target, {}, (err, numAffected, affectedDocuments, upsert) => {
            if (err) {
                reject(err);
            } else {
                resolve({numAffected, affectedDocuments, upsert});
            }
        })
    })
}
/**
 * 获取
 * @returns {Promise<unknown>}
 */
const get = async () => {
    return new Promise((resolve, reject) => {
        settings.findOne({_id: "1"}, (err, doc) => {
            if (err) {
                reject(err);
            } else {
                if (doc) {
                    if (!doc.kafka.authenticationTimeout) {
                        doc.kafka.authenticationTimeout = 10000;
                    }
                    if (!doc.kafka.reauthenticationThreshold) {
                        doc.kafka.reauthenticationThreshold = 10000;
                    }
                    resolve(doc);
                } else {
                    resolve(setting());
                }
            }
        })
    })
}


/**
 *保存
 */
ipcMain.handle('settings.save', async (event, value) => {
    if (value._id) {
        return update(value);
    } else {
        return insert(value);
    }

})

/**
 *根据ID获取
 */
ipcMain.handle('settings.get', async (event) => {
    return get();
})

/**
 *根据ID获取
 */
ipcMain.handle('settings.default', async (event) => {
    return new Promise((resolve) => {
        resolve(setting());
    })
})