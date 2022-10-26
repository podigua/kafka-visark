import {v4 as uuidv4} from "uuid";

/**
 * 组装kafka与文件夹
 * @param array
 * @returns {*[]}
 */
const getBrokersAndFolder = (array) => {
    let result = [];
    result = buildBrokerAndFolderTree(array, "");
    return result;
}
/**
 * 组装kafka与文件夹(树)
 * @param array
 * @param parent
 * @returns {*[]}
 */
const buildBrokerAndFolderTree = (array, parent) => {
    let result = [];
    if (array && array.length > 0) {
        array.forEach(node => {
            if ((!parent && !node.parent) || (parent && parent === node.parent)) {
                node.children = buildBrokerAndFolderTree(array, node._id);
                result.push(node);
            }
        })
    }
    return result;
}

export default {
    /**
     * 查询全部
     * @returns {Promise<unknown>}
     */
    query() {
        return new Promise((resolve, reject) => {
            window.api.brokers.getAll().then(res => {
                resolve(getBrokersAndFolder(res));
            }).catch((err) => {
                reject(err)
            })
        })
    }, /**
     * 保存
     * @param form
     * @returns {Promise<unknown>}
     */
    save(form) {
        return new Promise((resolve, reject) => {
            if (form._id) {
                window.api.brokers.update(form).then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(err)
                })
            } else {
                form._id = uuidv4();
                window.api.brokers.insert(form).then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(err)
                })
            }
        })
    }, /**
     * 连接kafka
     * @param row
     * @returns {Promise<unknown>}
     */
    connect(row, setting) {
        setting.clientId = 'kafka-visark';
        setting.brokers = row.brokers.split(",");
        if (row.isAuth) {
            setting.ssl = row.ssl;
            let sasl = {
                mechanism: row.sasl.mechanism,
                username: row.sasl.username,
                password: row.sasl.password,
            }
            setting.sasl = sasl;
        }
        return new Promise((resolve, reject) => {
            window.api.connect(row, setting).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            })
        })
    }
}