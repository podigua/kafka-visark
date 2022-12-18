module.exports = {
    chainWebpack: config => {
        config
            .plugin('html')
            .tap(args => {
                args[0].title = 'Kafka Visark'
                return args
            })
    }, pluginOptions: {
        electronBuilder: {
            preload: './src/preload.js', builderOptions: {
                // "publish": {
                //     provider: "generic", url: "https://kafka-visark-1300718879.cos.ap-nanjing.myqcloud.com/latest"
                // },
                "appId": "com.podigua.kafka",
                "productName": "Kafka Visark",
                "artifactName": "Kafka Visark-${os}-${version}.${ext}",
                "copyright": "Copyright © 2022",
                "directories": {
                    "output": "./dist_electron"
                },
                "dmg": {
                    "contents": [{
                        "x": 410, "y": 150, "type": "link", "path": "/Applications"
                    }, {
                        "x": 130, "y": 150, "type": "file"
                    }]
                },
                "mac": {
                    "category": "https://podigua.gitee.io/kafka-visark",
                    "identity": "podigua",
                    "hardenedRuntime": true,
                    "gatekeeperAssess": false,
                    "icon": "build/icons/icon.icns", "darkModeSupport": false

                },
                "win": {
                    "icon": "build/icons/icon.ico", "target": [{
                        "target": "nsis", "arch": ["x64", "ia32"]
                    }]
                },
                "nsis": {
                    "oneClick": false,
                    "allowElevation": true,
                    "allowToChangeInstallationDirectory": true,
                    "installerIcon": "build/icons/icon.ico",// 安装图标
                    "uninstallerIcon": "build/icons/uninstaller.ico",//卸载图标
                    "installerHeaderIcon": "build/icons/icon.ico", // 安装时头部图标
                    "createDesktopShortcut": true,
                    "createStartMenuShortcut": true,
                    "shortcutName": "Kafka-Visark",
                },
            }
        }
    }
}