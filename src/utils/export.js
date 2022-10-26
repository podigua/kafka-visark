const {ipcMain} = require('electron')
import path from 'path'

const ExcelJS = require('exceljs');
const titleStyle = {
    font: {
        name: '宋体', size: 14, bold: true,
    }, alignment: {
        vertical: 'middle', horizontal: 'center', wrapText: false,
    }, border: {
        top: {
            style: "thin",
        }, bottom: {
            style: "thin",
        }, left: {
            style: "thin",
        }, right: {
            style: "thin",
        },
    },
}
const dataStyle = {
    font: {
        name: '宋体', size: 10, bold: false,
    }, alignment: {
        vertical: 'middle', horizontal: 'center', wrapText: false,
    }, border: {
        top: {
            style: "thin",
        }, bottom: {
            style: "thin",
        }, left: {
            style: "thin",
        }, right: {
            style: "thin",
        },
    },
}
const leftDataStyle = {
    font: {
        name: '宋体', size: 10, bold: false,
    }, alignment: {
        vertical: 'middle', horizontal: 'left', wrapText: false,
    }, border: {
        top: {
            style: "thin",
        }, bottom: {
            style: "thin",
        }, left: {
            style: "thin",
        }, right: {
            style: "thin",
        },
    },
}
const dateStyle = {
    numFmt: 'yyyy/m/d h:mm',
    font: {
        name: '宋体', size: 10, bold: false,
    }, alignment: {
        vertical: 'middle', horizontal: 'center', wrapText: false,
    }, border: {
        top: {
            style: "thin",
        }, bottom: {
            style: "thin",
        }, left: {
            style: "thin",
        }, right: {
            style: "thin",
        },
    },
}

/**
 * 写文件
 * @param filePath
 * @param filename
 * @param list
 * @returns {Promise<Workbook>}
 */
const exportFile = async (filePath,filename, list) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('message');
    sheet.addRow(['topic', 'partition', 'offset', 'key', 'value', 'timestamp', 'headers']);

    sheet.columns = [
        { header: 'topic', key: 'topic', width: 10 },
        { header: 'partition', key: 'partition', width: 12 },
        { header: 'offset', key: 'offset', width: 10},
        { header: 'key', key: 'key', width: 35},
        { header: 'value', key: 'value', width: 80},
        { header: 'timestamp', key: 'time', width: 18},
        { header: 'headers', key: 'headers', width: 30},
    ];
    list.forEach((row,index) => {
        let time=new Date();
        time.setTime(Number(row.timestamp));
        row.time=time
        sheet.addRow([row.topic, row.partition, row.offset, row.key, row.value, time, row.headers]);
        sheet.getCell(index+2,1).style=dataStyle;
        sheet.getCell(index+2,2).style=dataStyle;
        sheet.getCell(index+2,3).style=dataStyle;
        sheet.getCell(index+2,4).style=dataStyle;
        sheet.getCell(index+2,5).style=leftDataStyle;
        sheet.getCell(index+2,6).style=dateStyle;
        sheet.getCell(index+2,7).style=dataStyle;
    })
    sheet.getCell(1,1).style=titleStyle;
    sheet.getCell(1,2).style=titleStyle;
    sheet.getCell(1,3).style=titleStyle;
    sheet.getCell(1,4).style=titleStyle;
    sheet.getCell(1,5).style=titleStyle;
    sheet.getCell(1,6).style=titleStyle;
    sheet.getCell(1,7).style=titleStyle;
    sheet.views = [
        {state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'H1', activeCell: 'A1'}
    ];
    return await workbook.xlsx.writeFile(path.join(filePath,filename));
}

ipcMain.handle('export.message', (event, filePath,filename, list) => {
    return exportFile(filePath,filename, list);
})
