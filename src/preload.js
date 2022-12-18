const {contextBridge, ipcRenderer, clipboard} = require('electron')

contextBridge.exposeInMainWorld('api', {
    brokers: {
        insert: (value) => {
            return ipcRenderer.invoke('brokers.insert', value);
        }, update: (value) => {
            return ipcRenderer.invoke('brokers.update', value);
        }, getAll: () => {
            return ipcRenderer.invoke('brokers.getAll');
        }, deleteById: (id) => {
            return ipcRenderer.invoke('brokers.deleteById', id);
        }
    }, settings: {
        save: (value) => {
            return ipcRenderer.invoke('settings.save', value);
        }, get: () => {
            return ipcRenderer.invoke('settings.get');
        }, default: () => {
            return ipcRenderer.invoke('settings.default');
        }
    }, connect: (config, option) => {
        return ipcRenderer.invoke('connect', config, option);
    }, disconnect: (id) => {
        return ipcRenderer.invoke('disconnect', id);
    }, topics: (id) => {
        return ipcRenderer.invoke('topics', id);
    }, consumers: (id) => {
        return ipcRenderer.invoke('consumers', id);
    }, deleteTopic: (id, option) => {
        return ipcRenderer.invoke('topic.delete', id, option);
    }, createTopic: (id, option) => {
        return ipcRenderer.invoke('topic.create', id, option);
    }, topicOffsets: (id, topic) => {
        return ipcRenderer.invoke('topic.offset', id, topic);
    }, consumerOffsets: (id, groupId) => {
        return ipcRenderer.invoke('consumer.offset', id, groupId);
    }, deleteConsumer: (id, groupId) => {
        return ipcRenderer.invoke('consumer.delete', id, groupId);
    }, createPartition: (id, option) => {
        return ipcRenderer.invoke('partition.create', id, option);
    }, startMessage: (id, topic, fromBeginning) => {
        return ipcRenderer.invoke('message.start', id, topic, fromBeginning);
    }, stopMessage: (id, topic) => {
        return ipcRenderer.invoke('message.stop', id, topic);
    }, message: (callback) => {
        ipcRenderer.on('message', (event, message) => {
            callback(message);
        })
    }, messageBySize: (option) => {
        return ipcRenderer.invoke("message.query.size", option);
    }, messageByTime: (option) => {
        return ipcRenderer.invoke("message.query.time", option);
    }, messageByStartAndSize: (option) => {
        return ipcRenderer.invoke("message.query.start.size", option);
    }, messageByEndAndSize: (option) => {
        return ipcRenderer.invoke("message.query.end.size", option);
    }, sendMessage: (id, message) => {
        return ipcRenderer.invoke("message.send", id, message);
    }, notice: (option) => {
        return ipcRenderer.invoke('notice', option);
    }, noticeFile: (title, filePath, filename) => {
        return ipcRenderer.invoke('notice.file', title, filePath, filename);
    }, setOffsets: (id, option) => {
        return ipcRenderer.invoke('offset.set', id, option);
    }, copy: (content) => {
        clipboard.writeText(content);
    }, members: (id, groupId) => {
        return ipcRenderer.invoke('members', id, groupId);
    }, openSaveFolder(name) {
        return ipcRenderer.invoke('select.save.folder', name);
    }, selectFolder(path) {
        return ipcRenderer.invoke('select.folder', path);
    }, exportMessage(filePath, filename, list) {
        return ipcRenderer.invoke('export.message', filePath, filename, list);
    }, exists(filePath) {
        return ipcRenderer.invoke('file.exists', filePath);
    }, showMessageBox(option) {
        return ipcRenderer.invoke('message.box', option);
    }, updateAvailable(callback) {
        ipcRenderer.on('update-available', (event) => {
            callback();
        })
    }, downloadProgress(callback) {
        ipcRenderer.on('download-progress', (event, data) => {
            callback(data);
        })
    }, updateDownloaded(callback) {
        ipcRenderer.on('update-downloaded', () => {
            callback();
        })
    }, checkUpdate() {
        return ipcRenderer.invoke('check-update');
    }
})
console.log("load preload success")