const fs = require('fs');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const credentials = require('./credentials.json');
const WebServer = require('./webserver');
const sendNotification = require('./notification');
const redirect_url = require('./config.json').redirect_url;
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  const { client_secret, client_id } = credentials.web;
  google.auth.GoogleAuth
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_url);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Bejelentkezés szükséges:', authUrl);
  sendNotification("Hi! Be kellene jelentkezni a mellékelt URL-en!", 'Bejelentkezés szükséges', authUrl);
  WebServer.waitForCode((code) => {
    oAuth2Client.getToken(code, (err, token) => {
      console.log(token)
      if (err) {
        console.error('Nem sikerült Access Tokent szerezni.', err);
        callback();
      }
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token mentve: ', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function removeToken() {
  fs.rmSync("token.json");
  authorize();
}

module.exports = {
  authorize: authorize,
  removeToken: removeToken
}