'use strict';
const Discord = require('discord.js');
const unirest = require('unirest');
const config = require('./config.json');
const cheerio = require('cheerio');
const https = require('https');
const webhook = require("webhook-discord")
const Schedule = require('node-schedule');

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
                country = country.toUpperCase().trim();
            }
            console.log(country + " keresése");
            if (country === "WORLD") {
                sendMessageWorld(message.channel);
            } else sendMessage(country, message.channel);
            console.log("Válasz elküldve");
        }
    } else if (message.content === "!covidis") {
        message.react('❤');
        message.channel.send("Hello!\nCOVidis bot vagyok\nOrszágokról küldök koronavírus információkat.\nHasználat:\n\t'!covid:<ország angol neve>'\n\t'!mask'");
    } else if (message.content === "!mask") {
        message.react('❤');
        getMask(message.channel);
    } else if(message.content === "!sendwebhook") sendWebhook();
});

client.login(config.token);

//Countries other than World and US
function sendMessage(country, channel) {
    getData(country).then(data => {
        if (data.imgUrl && data.imgUrl !== "") {
            console.log(data.imgUrl)
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
    var new_cases = 0;
    var deaths = 0;
    var new_deaths = 0;
    var recovered = 0;
    var req = unirest("GET", "https://coronavirus-monitor.p.rapidapi.com/coronavirus/worldstat.php");

    req.headers({
        "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
        "x-rapidapi-key": "ba898b1cf6msh168261419425c3cp171f77jsn5d7fc1872358"
    });

    req.end(function (res) {
        if (res.error) throw new Error(res.error);
        var stat = JSON.parse(res.body);
        cases = stat.total_cases;
        new_cases = stat.new_cases;
        deaths = stat.total_deaths;
        new_deaths = stat.new_deaths;
        recovered = stat.total_recovered;
        console.log("Sikeres! Válasz elküldve");
        var message = `🌍 A világ jelenlegi koronavírus helyzete:\n\n📄 Esetek: ${cases} (mai nap: +${new_cases})\n💀 Halál: ${deaths} (mai nap: +${new_deaths})\n💚 Meggyógyult: ${recovered}`;
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
        var cases = 0;
        var new_cases = "nincs új adat";
        var deaths = 0;
        var new_deaths = "nincs új adat";
        var recovered = 0;
        var serious_critical = 0;
        var total_cases_per_million = 0;
        var hatosagi_karanten = "Ez az adat valahová eltűnt";
        var mintavetel = "Ezt az adatot elvitte a cica";
        var attachment_status = "\n🗺 A térképet nem tudtam megszerezni.";

        if (country === "HUNGARY") {
            var host = "koronavirus.gov.hu"
            var req = https.request({ hostname: host }, (res) => {
                res.on('data', (d) => {
                    var $ = cheerio.load(d);
                    if ($('#api-karantenban').text() !== "") {
                        hatosagi_karanten = $('#api-karantenban').text().replace(" ", ",");
                    }
                    if ($('#api-mintavetel').text() !== "") {
                        mintavetel = $('#api-mintavetel').text().replace(" ", ",");
                    }
                    if ($('.terkepek').find('img').attr('src')) {
                        result.imgUrl = $('.terkepek').find('img').attr('src');
                    }
                })
            });
            req.on('error', error => { console.log(host + " nem érhető el.") })
            req.end();
        }

        var req = unirest("GET", "https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_country.php");

        req.headers({
            "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
            "x-rapidapi-key": "ba898b1cf6msh168261419425c3cp171f77jsn5d7fc1872358"
        });

        

        req.end(function (res) {
            if (res.error) throw new Error(res.error);
            var countries_stat = JSON.parse(res.body).countries_stat;
            var countryFound = false;
            countries_stat.forEach(stat => {
                if (stat.country_name.toUpperCase() === country) {
                    countryFound = true;
                    cases = stat.cases;
                    new_cases = stat.new_cases;
                    deaths = stat.deaths;
                    new_deaths = stat.new_deaths;
                    recovered = stat.total_recovered;
                    serious_critical = stat.serious_critical;
                    total_cases_per_million = stat.total_cases_per_1m_population;
                }
            });

            if(result.imgUrl)attachment_status = "";

            if (countryFound) {
                if (country === "HUNGARY") {
                    result.message = `🌍 ${country} jelenlegi koronavírus helyzete:\n\n📄 Esetek: ${cases} (${new_cases==="0"?"Nincs új adat":"mai nap +"+new_cases})\n💀 Halál: ${deaths} (${new_deaths==="0"?"Nincs új adat":"mai nap +"+new_deaths})\n🆘 Súlyos beteg: ${serious_critical}\n💚 Meggyógyult: ${recovered}\n🔢 1 Millió főre eső eset: ${total_cases_per_million}\n🏥 Hatósági házi karanténban: ${hatosagi_karanten}\n🧪 Mintavételek száma: ${mintavetel}${attachment_status}`;
                } else result.message = `🌍 ${country} jelenlegi koronavírus helyzete:\n\n📄 Esetek: ${cases} (${new_cases==="0"?"Nincs új adat":"mai nap +"+new_cases})\n💀 Halál: ${deaths} (${new_deaths==="0"?"Nincs új adat":"mai nap +"+new_deaths})\n🆘 Súlyos beteg: ${serious_critical}\n💚 Meggyógyult: ${recovered}\n🔢 1 Millió főre eső eset: ${total_cases_per_million}`;
                resolve(result);
            } else {
                console.log("Nincs találat! Információ elküldve");
                reject(result);
            }

        });
    }).then((res) => {
        result = res;
    }).catch((rej) => {
        result = rej;
    });
    return result;
}

var sendWebhook = function () {
    console.log("WebHook küldése");
    getData("HUNGARY").then(data => {
        const Hook = new webhook.Webhook(config.webhook);
        var d = new Date();
        const msg = new webhook.MessageBuilder()
                .setName("COVidis")
                .setColor("#7589DA")
                .setTitle(`Koronavírus statisztikák ${d.getFullYear()}.${d.getMonth()+1<10?"0"+(d.getMonth()+1):d.getMonth()+1}.${d.getDate()+1<10?"0"+(d.getDate()+1):d.getDate()+1}.`)
                .setDescription(data.message)
                .setImage(data.imgUrl);
                
        Hook.send(msg);
        console.log("Webhook sent")
    }).catch(err => {
        console.log(err);
    })

}

var sch = new Schedule.scheduleJob(config.rule,sendWebhook)