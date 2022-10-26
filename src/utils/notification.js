import * as Path from "path";

const {Notification, ipcMain, shell} = require("electron")
import path from 'path'

const show = async (option) => {
    return new Promise((resolve, reject) => {
        if (Notification.isSupported()) {
            let notice = new Notification({
                title: option.title, body: option.body,
            });
            notice.show();
            resolve(true)
        } else {
            reject(false)
        }
    })
}
const showFile = async (title, filePath, filename) => {
    return new Promise((resolve, reject) => {
        let file = path.join(filePath, filename);
        console.log("Notification.isSupported():",Notification.isSupported())
        if (Notification.isSupported()) {
            let notice = new Notification({
                title: title, subtitle: file
            });
            notice.on('click', () => {
                console.log("filePath:",file)
                shell.showItemInFolder(file);
            })
            notice.show();
            resolve(true)
        } else {
            reject(false)
        }
    })
}
ipcMain.handle('notice', (event, option) => {
    return show(option);
})

ipcMain.handle('notice.file', (event, title, filePath, filename) => {
    return showFile(title, filePath, filename)
})