const express = require('express')
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 6000;
const options = {
    key: fs.readFileSync(path.join(__dirname, 'https', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'https', 'cert.pem'))
  };
/**
 * 
 * @param {Function} callback 
 */
function waitForCode(callback) {
    var httpsServer = https.createServer(options, app);
    app.get('/', (req, res) => {
        var url = path.join(__dirname, "auth_redirect", "success.html")
        res.sendFile(url);
        httpsServer.close();
        console.log("WebServer bezárva");
        callback(req.query.code);
    })
    httpsServer.listen(port);
    console.log("WebServer létrehozva az átirányításhoz.");
}
module.exports.waitForCode = waitForCode