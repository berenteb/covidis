'use strict';
const Discord = require('discord.js');
const unirest = require('unirest');
const config = require('./config.json');
const indexes = require('./row_indexes.json');
const webhook = require("webhook-discord")
const Schedule = require('node-schedule');
const { getMapPromise, getDataPromise } = require("./hungary")
const sendNotification = require('./notification');
const { authorize } = require('./auth')
// Create an instance of a Discord client
const client = new Discord.Client();

client.on('ready', (event) => {
    console.log('DiscordJS készen áll!');
});

client.on('error', (event) => {
    console.log(event);
    process.exit(-1);
})

// Create an event listener for messages
client.on('message', message => {
    if (message.content.includes('!covid:')) {
        var messageSplit = message.content.split(":");
        if (messageSplit.length === 2) {
            message.react('❤');
            var country = messageSplit[1];
            if (country !== null || country !== "") {
                country = formatCountryName(country);
                console.log(country + " keresése");
                sendMessage(country, message.channel);
                console.log("Válasz elküldve");
            }
        }
    } else if (message.content === "!covidis") {
        message.react('❤');
        message.channel.send("Hello!\nCOVidis bot vagyok\nOrszágokról küldök koronavírus információkat.\nHasználat:\n\t'!covid:<ország angol neve>'");
    } else if (message.content === "!sendwebhook") sendWebhook();
});

client.login(config.token);
authorize((auth) => {
    if (auth) {
        console.log("Google Auth sikeres.")
    } else {
        sendNotification('Hi! A Google Auth nem sikerült!.', 'Beavatkozás szükséges')
        console.log("Google Auth sikertelen.")
        process.exit(-1);
    }
})

//Countries other than World and US
function sendMessage(country, channel) {
    if (country === "Hungary") {
        getDataForHungary().then(data => {
            if (data.mapUrl) {
                var attachment = new Discord.MessageAttachment(data.mapUrl);
                channel.send(data.msg, attachment);
            } else {
                data.msg += "\n\n🗺 A térképet nem tudtam megszerezni."
                channel.send(data.msg);
            }
        }).catch(err => {
            console.log(err);
            if(err === "Bejelentkezés szükséges"){
                sendMessage("Hungary", channel);
            }else{
                channel.send("⚡️ Nem sikerült lekérnem az adatokat.");
            }
        })
    } else {
        getData(country).then(repsonse => {
            console.log("Siker, elküldve!");
            channel.send(repsonse);
        }).catch(err => {
            console.log(err);
            channel.send(err);
        })
    }
}

function getDataForHungary() {
    return new Promise((resolve, reject) => {
        var result = {};
        Promise.all([getDataPromise(), getMapPromise()]).then(data => {
            result.mapUrl = data[1];
            var statRaw = data[0];
            var stat = formatDataArray(statRaw);
            if (!stat) reject("⚡️ Nem sikerült az adatokat lekérni!");
            var msg = "🇭🇺 Magyarország jelenlegi koronavírus helyzete:\n\n"
            msg += `🦠 Összes eset: ${stat[indexes.cases]} (${stat[indexes.new_cases]})\n`;
            msg += `▶️ Ebből aktív: ${stat[indexes.active]}\n`;
            msg += `☠️ Halálesetek: ${stat[indexes.deaths]} (${stat[indexes.new_deaths]})\n`;
            msg += `💚 Meggyógyult: ${stat[indexes.recovered]} (${stat[indexes.new_recovered]})\n`;
            msg += `🏥 Lélegeztetőgépen: ${stat[indexes.machine]} (${stat[indexes.new_machine]})\n`;
            msg += `🧪 Mintavételek száma: ${stat[indexes.tests]} (${stat[indexes.new_tests]})\n`;
            msg += `🧮 Pozitív tesztek aránya: ${stat[indexes.test_ratio]}\n`;
            result.msg = msg;
            resolve(result);
        }).catch(err => {
            console.log(err);
            reject(err);
        })
    })
}

function getData(country) {
    return new Promise((resolve, reject) => {
        var cases = 0;
        var deaths = 0;
        var recovered = 0;

        var req = unirest("GET", "https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/total");

        req.query({
            "country": country
        });

        req.headers({
            "x-rapidapi-host": "covid-19-coronavirus-statistics.p.rapidapi.com",
            "x-rapidapi-key": config.rapid_api_key,
            "useQueryString": true
        });

        req.end(function (res) {
            if (res.error) reject("⚡️ Sajnos valamilyen hibába ütköztem.")
            var body = JSON.parse(res.raw_body);
            if (body.message === "OK") {
                cases = body.data.confirmed;
                deaths = body.data.deaths;
                recovered = body.data.recovered;
                var messageText = `🌍 ${country} jelenlegi koronavírus helyzete:\n\n🦠 Esetek: ${numberWithCommas(cases)}\n💀 Halálesetek: ${numberWithCommas(deaths)}\n💚 Meggyógyult: ${numberWithCommas(recovered)}`;
                resolve(messageText);
            } else {
                reject("⚡️ Nem találtam információt ehhez az országhoz.")
            }
        });
    })
}

var sendWebhook = function () {
    console.log("WebHook küldése");
    getDataForHungary().then(data => {
        const Hook = new webhook.Webhook(config.webhook);
        var d = new Date();
        const msg = new webhook.MessageBuilder()
            .setName("COVidis")
            .setColor("#7589DA")
            .setTitle(`Koronavírus statisztikák ${d.getFullYear()}.${d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1}.${d.getDate() < 10 ? "0" + (d.getDate()) : d.getDate()}.`)
            .setDescription(data.msg)
            .setImage(data.mapUrl);

        Hook.send(msg);
        console.log("WebHook sikeres!")
    }).catch(err => {
        console.log(err);
    })
}

function numberWithCommas(x) {
    var x_str = x.toString();
    var new_str = "";
    for (let i = 1; i <= x_str.length; i++) {
        new_str = x_str.charAt(x_str.length - i) + new_str;
        if (i % 3 === 0 && i != x_str.length && x_str.charAt(x_str.length - i - 1) != "-") {
            new_str = "," + new_str;
        }
    }
    return new_str;
}

function formatCountryName(str) {
    str = str.toLowerCase().trim();
    while (str.includes("  ")) {
        str = str.replace("  ", " ");
    }
    var str_split = str.split(" ");
    var new_str = "";
    str_split.forEach((part) => {
        part.trim();
        part = part.charAt(0).toUpperCase() + part.substring(1);
        if (new_str === "")
            new_str = part;
        else
            new_str += " " + part;
    });
    new_str.trim();
    return new_str;
}

function formatDataArray(dataArray) {
    if (Array.isArray(dataArray)) {
        for (let i = 0; i < dataArray.length; i++) {
            var data = dataArray[i];
            let isNum = /^(-{0,1}[0-9]+)$/.test(data);
            if (isNum) {
                // let isNegative = /^(-{1,1}[0-9]+)$/.test(data);
                var dataFormatted = /*`${isNegative?"":"+"}`+*/numberWithCommas(data);
                dataArray[i] = dataFormatted;
            }
        }
        return dataArray;
    } else
        return false;
}

var webhook_schedule = new Schedule.scheduleJob(config.rule, sendWebhook)