import {autoUpdater} from "electron-updater"

const {dialog, ipcMain} = require('electron')
const app = require('electron').app;
const log = require("electron-log")
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"
let window = null;
autoUpdater.autoDownload = false;
autoUpdater.on('checking-for-update', res => {
    log.info("获取版本信息:", res)
})
autoUpdater.on('update-not-available', res => {
    log.info("没有可更新版本:", res)
})
autoUpdater.on('update-available', res => {
    dialog.showMessageBox({
        type: 'info', title: '软件更新', message: '发现新版本, 确定更新?', buttons: ['确定', '取消']
    }).then(resp => {
        if (resp.response === 0) {
            autoUpdater.downloadUpdate();
            window.webContents.send('update-available', res)
        }
    })
})
autoUpdater.on('download-progress', res => {
    window.webContents.send('download-progress', res)
    log.info("下载监听:", res)
})
autoUpdater.on('update-downloaded', () => {
    window.webContents.send('update-downloaded', true);
    dialog.showMessageBox({
        title: '下载完成', message: '最新版本已下载完成, 退出程序进行安装', buttons: ['确定', '取消']
    }).then((resp) => {
        if (resp.response === 0) {
            autoUpdater.quitAndInstall()
        }
    })
})
export default {
    setUpdateWindow(win) {
        window = win;
    }
}
/**
 * 检查自动更新
 */
ipcMain.handle('check-update', (event) => {
    return autoUpdater.checkForUpdates();
})