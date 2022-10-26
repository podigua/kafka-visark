'use strict'

import {app, protocol, BrowserWindow,} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS_DEVTOOLS} from 'electron-devtools-installer'
import path from "path";

const isDevelopment = process.env.NODE_ENV !== 'production'
require('./utils/datastrore/index')
require('./utils/notification')
const {setWindow} = require('./utils/dialog')
require('./utils/export')
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {secure: true, standard: true}}])

require('./utils/kafka')
let willQuitApp = false;
let window = null;

async function createWindow() {
    // Create the browser window.
    window = new BrowserWindow({
        width: 800, height: 600, minHeight: 600, minWidth: 800, webPreferences: {
            preload: path.join(__dirname, '/preload.js')
        }
    })
    window.maximize();
    setWindow(window);
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await window.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) window.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        window.loadURL('app://./index.html')
    }
}

// Quit when all windows are closed.
// app.on('window-all-closed', () => {
//     // On macOS it is common for applications and their menu bar
//     // to stay active until the user quits explicitly with Cmd + Q
//     if (process.platform !== 'darwin') {
//         app.quit()
//     }
// })
//
// app.on('activate', () => {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
// })


app.on('activate', () => window.show());

app.on('before-quit', () => willQuitApp = true);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            //  await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()
    window.on('close', (e) => {
        if (willQuitApp) {
            window = null;
        } else {
            e.preventDefault();
            window.hide();
        }
    });

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
