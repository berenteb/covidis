'use strict';
const Discord = require('discord.js');
const unirest = require('unirest');
const config = require('./config.json');
const cheerio = require('cheerio');
const https = require('https');
const webhook = require("webhook-discord")
const Schedule = require('node-schedule');
const { parse } = require('path');

var old_hun_data;
var current_hun_data;

// Create an instance of a Discord client
const client = new Discord.Client();

client.on('ready', (event) => {
    console.log('Készen áll!');
});

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
        message.channel.send("Hello!\nCOVidis bot vagyok\nOrszágokról küldök koronavírus információkat.\nHasználat:\n\t'!covid:<ország angol neve>'\n\t'!mask'");
    } else if (message.content === "!mask") {
        message.react('❤');
        getMask(message.channel);
    } else if (message.content === "!sendwebhook") sendWebhook();
});

client.login(config.token);

//Countries other than World and US
function sendMessage(country, channel) {
    getData(country).then(data => {
        if (data.imgUrl && data.imgUrl !== "") {
            console.log(data.imgUrl ? "Térkép megtalálva" : "Térkép nem lett megtalálva")
            var image = new Discord.MessageAttachment(data.imgUrl);
            channel.send(data.message, image);
        } else channel.send(data.message);
    }).catch(err => {
        console.log(err);
    })
}

function sendMessageWorld(channel) {

    console.log("World keresése");
    var cases = 0;
    var deaths = 0;
    var recovered = 0;

    var req = unirest("GET", "https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/total");

    req.headers({
        "x-rapidapi-host": "covid-19-coronavirus-statistics.p.rapidapi.com",
        "x-rapidapi-key": config.rapid_api_key,
        "useQueryString": true
    });

    req.end(function (res) {
        if (res.error) throw new Error(res.error);
        var stat = JSON.parse(res.body);
        cases = stat.data.confirmed;
        deaths = stat.data.deaths;
        recovered = stat.data.recovered;
        console.log("Sikeres! Válasz elküldve");
        var message = `🌍 A világ jelenlegi koronavírus helyzete:\n\n📄 Esetek: ${cases}\n💀 Halál: ${deaths}\n💚 Meggyógyult: ${recovered}`;
        channel.send(message);
    });
}

async function getMask(channel) {
    var random = Math.floor(Math.random() * 6) + 1;
    var path = `./mask/${random}.png`;
    console.log("Random maszk tip küldése");
    const attachment = new Discord.MessageAttachment(path);
    channel.send(`Itt egy tip:`, attachment);
    console.log("Sikeres! Válasz elküldve");
}

async function getData(country) {
    var result = {
        message: "Jajj, tervezőm!"
    };
    await new Promise((resolve, reject) => {

        if (country === "Hungary") {
            var hun_data = {
                fertozott: 0,
                elhunyt: 0,
                gyogyult: 0,
                karanten: 0,
                mintavetel: 0
            }
            var statistics = {
                fertozott_new: "",
                elhunyt_new: "",
                gyogyult_new: "",
                karanten_new: "",
                mintavetel_new: ""
            }
            var attachment_status = "\n🗺 A térképet nem tudtam megszerezni.";
            var host = "koronavirus.gov.hu"
            var req = https.request({ hostname: host }, (res) => {
                res.on('data', (d) => {
                    var $ = cheerio.load(d);
                    if ($('#api-fertozott-pest').text() !== "") {
                        hun_data.fertozott += getNum($('#api-fertozott-pest').text());
                    }
                    if ($('#api-fertozott-videk').text() !== "") {
                        hun_data.fertozott += getNum($('#api-fertozott-videk').text());
                    }
                    if ($('#api-gyogyult-pest').text() !== "") {
                        hun_data.gyogyult += getNum($('#api-gyogyult-pest').text());
                    }
                    if ($('#api-gyogyult-videk').text() !== "") {
                        hun_data.gyogyult += getNum($('#api-gyogyult-videk').text());
                    }
                    if ($('#api-elhunyt-pest').text() !== "") {
                        hun_data.elhunyt += getNum($('#api-elhunyt-pest').text());
                    }
                    if ($('#api-elhunyt-videk').text() !== "") {
                        hun_data.elhunyt += getNum($('#api-elhunyt-videk').text())
                    }
                    if ($('#api-karantenban').text() !== "") {
                        hun_data.karanten = getNum($('#api-karantenban').text())
                    }
                    if ($('#api-mintavetel').text() !== "") {
                        hun_data.mintavetel = getNum($('#api-mintavetel').text());
                    }
                    if ($('.terkepek').find('img').attr('src')) {
                        result.imgUrl = $('.terkepek').find('img').attr('src');
                    }
                });
                res.on('end', () => {
                    hun_data.fertozott += hun_data.gyogyult + hun_data.elhunyt;
                    if(hun_data !== current_hun_data){
                        old_hun_data = current_hun_data;
                        current_hun_data = hun_data;
                    }
                    if (old_hun_data != undefined) {
                        statistics.fertozott_new = ` (+${numberWithCommas(current_hun_data.fertozott - old_hun_data.fertozott)})`
                        statistics.elhunyt_new = ` (+${numberWithCommas(current_hun_data.elhunyt - old_hun_data.elhunyt)})`
                        statistics.gyogyult_new = ` (+${numberWithCommas(current_hun_data.gyogyult - old_hun_data.gyogyult)})`
                        var karanten_diff = current_hun_data.karanten - old_hun_data.karanten;
                        statistics.karanten_new = ` (${(karanten_diff < 0 ? "-" : "+") + numberWithCommas(karanten_diff)})`
                        statistics.mintavetel_new = ` (+${numberWithCommas(current_hun_data.mintavetel - old_hun_data.mintavetel)})`
                    }
                    if (result.imgUrl) attachment_status = "";
                    result.message = `🇭🇺 Magyarország jelenlegi koronavírus helyzete:\n\n🦠 Esetek: ${numberWithCommas(hun_data.fertozott)} ${statistics.fertozott_new} \n💀 Halálesetek: ${numberWithCommas(hun_data.elhunyt)} ${statistics.elhunyt_new}\n💚 Meggyógyult: ${numberWithCommas(hun_data.gyogyult)} ${statistics.gyogyult_new}\n🏥 Hatósági házi karanténban: ${numberWithCommas(hun_data.karanten)} ${statistics.karanten_new}\n🧪 Mintavételek száma: ${numberWithCommas(hun_data.mintavetel)}${statistics.mintavetel_new}${attachment_status}`;
                    resolve(result);
                });
            });
            req.on('error', error => { console.log(host + " nem érhető el.") })
            req.end();
        } else {
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
                var body = JSON.parse(res.raw_body);
                var countryFound = false;
                if (body.message === "OK") {
                    countryFound = true;
                    cases = body.data.confirmed;
                    deaths = body.data.deaths;
                    recovered = body.data.recovered;
                } else {
                    console.log("Message != OK");
                }
                if (countryFound) {
                    result.message = `🌍 ${country} jelenlegi koronavírus helyzete:\n\n🦠 Esetek: ${numberWithCommas(cases)}\n💀 Halálesetek: ${numberWithCommas(deaths)}\n💚 Meggyógyult: ${numberWithCommas(recovered)}`;
                } else {
                    result.message = "⚡️ Sajnos valamilyen hibába ütköztem. (Az is lehet, hogy nem találtam ilyen országot.)"
                }
                resolve(result);
            });

        }

    }).then((res) => {
        result = res;
    }).catch((rej) => {
        result = rej;
    });
    return result;
}

var sendWebhook = function () {
    console.log("WebHook küldése");
    getData("Hungary").then(data => {
        const Hook = new webhook.Webhook(config.webhook);
        var d = new Date();
        const msg = new webhook.MessageBuilder()
            .setName("COVidis")
            .setColor("#7589DA")
            .setTitle(`Koronavírus statisztikák ${d.getFullYear()}.${d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1}.${d.getDate() < 10 ? "0" + (d.getDate()) : d.getDate()}.`)
            .setDescription(data.message)
            .setImage(data.imgUrl);

        Hook.send(msg);
        console.log("Webhook sent")
    }).catch(err => {
        console.log(err);
    })
}

function numberWithCommas(x) {
    var x_str = x.toString();
    var new_str = "";
    for(let i = 1; i <= x_str.length; i++){
        new_str = x_str.charAt(x_str.length - i) + new_str;
        if(i % 3 === 0 && i != x_str.length){
            new_str = "," + new_str;
        }
    }
    return new_str;
}

function getNum(str){
    while(str.includes(" ")){
        str = str.replace(" ", "");
    }
    var num = 0;
    try{
        num = parseInt(str);
    }catch(err){
        console.log("Formázási hiba: "+str);
    }
    return num;
}

function formatCountryName(str){
    str = str.toLowerCase().trim();
    while(str.includes("  ")){
        str = str.replace("  ", " ");
    }
    var str_split = str.split(" ");
    var new_str = "";
    str_split.forEach((part)=>{
        part.trim();
        part = part.charAt(0).toUpperCase() + part.substring(1);
        if(new_str === "")
            new_str = part;
        else
            new_str += " " + part;
    });
    new_str.trim();
    return new_str;
}

var webhook_schedule = new Schedule.scheduleJob(config.rule, sendWebhook)