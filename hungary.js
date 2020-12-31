const config = require('./config.json');
const credentials = require('./credentials.json');
const cheerio = require('cheerio');
const https = require("https")
const { google } = require('googleapis');
const Auth = require("./auth");
function getMapPromise() {
    return new Promise((res) => {
        var host = "koronavirus.gov.hu"
        var req = https.request({ hostname: host }, (response) => {
            var str = "";
            response.on('data', (chunk) => {
                str += chunk;
            });
            response.on('end', () => {
                var $ = cheerio.load(str);
                var imgUrl = $('.terkepek').find('img').attr('src');
                if (imgUrl) {
                    res(imgUrl);
                } else {
                    res();
                }
            });
        });
        req.on('error', error => {
            console.log(host + " nem érhető el.");
            res()
        })
        req.end();
    });
}
function getDataPromise() {
    return new Promise((resolve, reject) => {
        Auth.authorize(credentials.web, (auth) => {
            const sheets = google.sheets({ version: 'v4', auth });
            sheets.spreadsheets.values.get({
                spreadsheetId: config.sheetID,
                range: 'koronahun!A300:Z',
            }, (err, res) => {
                if (err){
                    reject("API hiba: "+err);
                }
                const rows = res.data.values;
                if (rows.length) {
                    resolve(rows[rows.length - 1]);
                } else {
                    reject("Nem kapott adatot.")
                }
            });
        })
    })
}

module.exports = {
    getDataPromise: getDataPromise,
    getMapPromise: getMapPromise
}