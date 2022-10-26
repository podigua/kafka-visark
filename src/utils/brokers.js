import Datastore from 'nedb'

const os = require('os')
const {ipcMain} = require('electron')
import path from 'path'

const brokers = new Datastore({
    autoload: true, filename: path.join(os.homedir(), 'kafka-visark', 'data', 'brokers.db')
})


/**
 *插入
 */
ipcMain.handle('brokers.insert', async (event, value) => {
    return new Promise((resolve, reject) => {
        brokers.insert(value, (err, doc) => {
            if (err) {
                reject(err);
            } else {
                resolve(doc);
            }
        })
    })
})

/**
 *更新
 */
ipcMain.handle('brokers.update', async (event, value) => {
    return new Promise((resolve, reject) => {
        let target = Object.assign({}, value)
        console.log(target);
        delete target._id
        brokers.update({_id: value._id}, target, {}, (err, numAffected, affectedDocuments, upsert) => {
            if (err) {
                reject(err);
            } else {
                resolve({numAffected, affectedDocuments, upsert});
            }
        })
    })
})


/**
 *根据ID获取
 */
ipcMain.handle('brokers.getById', async (event, id) => {
    return new Promise((resolve, reject) => {
        brokers.findOne({_id: id}, (err, doc) => {
            if (err) {
                reject(err);
            } else {
                resolve(doc);
            }
        })
    })
})
const getByParent = async (parent) => {
    return new Promise((resolve, reject) => {
        brokers.find({parent}, (err, docs) => {
            if (err) {
                reject(err);
            } else {
                resolve(docs);
            }
        })
    })
}

const deleteById = async (id) => {
    let list = await getByParent(id);
    console.log("根据parent", id, "获取子:", list);
    if (list && list.length > 0) {
        for (const node of list) {
            await deleteById(node._id);
        }
    }
    return new Promise((resolve, reject) => {
        console.log("根据ID删除", id);
        brokers.remove({_id: id}, {}, (err, number) => {
            if (err) {
                reject(err);
            } else {
                resolve(number);
            }
        })
    })
}
/**
 *获取全部
 */
ipcMain.handle('brokers.getAll', async (event) => {
    return new Promise((resolve, reject) => {
        brokers.find({}).sort({name: -1}).exec((err, doc) => {
            if (err) {
                reject(err);
            } else {
                resolve(doc);
            }
        })
    })
})

/**
 * 根据ID删除
 */
ipcMain.handle('brokers.deleteById', async (event, id) => {
    return deleteById(id);
})