const {dialog, ipcMain} = require('electron')
const os = require('os');
const fs = require('fs');
import path from 'path'

let window = null;
export const setWindow = (browserWindow) => {
    window = browserWindow;
}
/**
 * 选择文件夹
 */
ipcMain.handle('select.folder', (event, folder) => {
    let filePath = folder || path.join(os.homedir(), 'Documents')
    return dialog.showOpenDialog(window, {
        title: "选择文件夹",
        defaultPath: filePath,
        properties: ['openDirectory', 'createDirectory', 'promptToCreate', 'noResolveAliases']
    })
})

/**
 * 选择保存文件件(默认文档)
 */
ipcMain.handle('select.save.folder', (event, name) => {
    return dialog.showSaveDialog(window, {
        title: "保存", defaultPath: path.join(os.homedir(), 'Documents', name),
    })
})


ipcMain.handle('message.box', (event, option) => {
    return dialog.showMessageBox(window,option);
})

ipcMain.handle('file.exists', (event, filePath) => {
    return new Promise((resolve, reject) => {
        let exists = fs.existsSync(filePath)
        if (exists) {
            resolve(true);
        } else {
            reject(false);
        }
    })
})