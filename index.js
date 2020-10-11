'use strict';
const Discord = require('discord.js');
const unirest = require('unirest');
const config = require('./config.json');
const cheerio = require('cheerio');
const https = require('https');
const webhook = require("webhook-discord")
const Schedule = require('node-schedule');

var old_hun_data = {
    fertozott_pest: 0,
    fertozott_videk: 0,
    gyogyult_pest: 0,
    gyogyult_videk: 0,
    elhunyt_pest: 0,
    elhunyt_videk: 0,
    hatosagi_karanten: 0,
    mintavetel: 0
}

var current_hun_data = {
    fertozott_pest: 0,
    fertozott_videk: 0,
    gyogyult_pest: 0,
    gyogyult_videk: 0,
    elhunyt_pest: 0,
    elhunyt_videk: 0,
    hatosagi_karanten: 0,
    mintavetel: 0
}

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
                country = country.trim().toLowerCase();
                var country_split = country.split(" ");
                country = "";
                country_split.forEach(element => {
                    country = country === "" ? element.charAt(0).toUpperCase() + element.slice(1) : country + " " + element.charAt(0).toUpperCase() + element.slice(1);
                });
            }
            console.log(country + " keresése");
            sendMessage(country, message.channel);
            console.log("Válasz elküldve");
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
    var deaths = 0;
    var recovered = 0;

    var req = unirest("GET", "https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/total");

    req.headers({
        "x-rapidapi-host": "covid-19-coronavirus-statistics.p.rapidapi.com",
        "x-rapidapi-key": "ba898b1cf6msh168261419425c3cp171f77jsn5d7fc1872358",
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
                fertozott_pest: 0,
                fertozott_videk: 0,
                gyogyult_pest: 0,
                gyogyult_videk: 0,
                elhunyt_pest: 0,
                elhunyt_videk: 0,
                hatosagi_karanten: 0,
                mintavetel: 0
            }
            var statistics = {
                fertozott_pest_new: "",
                fertozott_videk_new: "",
                gyogyult_pest_new: "",
                gyogyult_videk_new: "",
                elhunyt_pest_new: "",
                elhunyt_videk_new: "",
                hatosagi_karanten_new: "",
                mintavetel_new: ""
            }
            var attachment_status = "\n🗺 A térképet nem tudtam megszerezni.";
            var host = "koronavirus.gov.hu"
            var req = https.request({ hostname: host }, (res) => {
                res.on('data', (d) => {
                    var $ = cheerio.load(d);
                    if ($('#api-fertozott-pest').text() !== "") {
                        parseInt(hun_data.fertozott_pest = $('#api-fertozott-pest').text().replace(" ", ""))
                    }
                    if ($('#api-fertozott-videk').text() !== "") {
                        parseInt(hun_data.fertozott_videk = $('#api-fertozott-videk').text().replace(" ", ""))
                    }
                    if ($('#api-gyogyult-pest').text() !== "") {
                        parseInt(hun_data.gyogyult_pest = $('#api-gyogyult-pest').text().replace(" ", ""))
                    }
                    if ($('#api-gyogyult-videk').text() !== "") {
                        parseInt(hun_data.gyogyult_videk = $('#api-gyogyult-videk').text().replace(" ", ""))
                    }
                    if ($('#api-elhunyt-pest').text() !== "") {
                        parseInt(hun_data.elhunyt_pest = $('#api-elhunyt-pest').text().replace(" ", ""))
                    }
                    if ($('#api-elhunyt-videk').text() !== "") {
                        parseInt(hun_data.elhunyt_videk = $('#api-elhunyt-videk').text().replace(" ", ""))
                    }
                    if ($('#api-karantenban').text() !== "") {
                        parseInt(hun_data.hatosagi_karanten = $('#api-karantenban').text().replace(" ", ""))
                    }
                    if ($('#api-mintavetel').text() !== "") {
                        parseInt(hun_data.mintavetel = $('#api-mintavetel').text().replace(" ", ""));
                    }
                    if ($('.terkepek').find('img').attr('src')) {
                        result.imgUrl = $('.terkepek').find('img').attr('src');
                    }
                    if(hun_data!==current_hun_data){
                        old_hun_data = current_hun_data;
                        current_hun_data = hun_data;
                    }
                    if(old_hun_data.fertozott_pest!==0){
                        statistics.fertozott_pest_new = ` (+${current_hun_data.fertozott_pest - old_hun_data.fertozott_pest})`
                        statistics.fertozott_videk_new = ` (+${current_hun_data.fertozott_videk - old_hun_data.fertozott_videk})`
                        statistics.gyogyult_pest_new = ` (+${current_hun_data.gyogyult_pest - old_hun_data.gyogyult_pest})`
                        statistics.gyogyult_videk_new = ` (+${current_hun_data.gyogyult_videk - old_hun_data.gyogyult_videk})`
                        statistics.elhunyt_pest_new = ` (+${current_hun_data.elhunyt_pest - old_hun_data.elhunyt_pest})`
                        statistics.elhunyt_videk_new = ` (+${current_hun_data.elhunyt_videk - old_hun_data.elhunyt_videk})`
                        statistics.hatosagi_karanten_new = ` (+${current_hun_data.hatosagi_karanten - old_hun_data.hatosagi_karanten})`
                        statistics.mintavetel_new = ` (+${current_hun_data.mintavetel - old_hun_data.mintavetel})`
                    }
                    result.message = `🇭🇺 ${country} jelenlegi koronavírus helyzete:\n\n🦠 Aktív esetek (Budapest/Vidék): ${numberWithCommas(hun_data.fertozott_pest)}${numberWithCommas(statistics.fertozott_pest_new)} / ${numberWithCommas(hun_data.fertozott_videk)}${numberWithCommas(statistics.fertozott_videk_new)}\n💀 Összes haláleset (Budapest/Vidék): ${numberWithCommas(hun_data.elhunyt_pest)}${numberWithCommas(statistics.elhunyt_pest_new)} / ${numberWithCommas(hun_data.elhunyt_videk)}${numberWithCommas(statistics.elhunyt_videk_new)}\n💚 Meggyógyult (Budapest/Vidék): ${numberWithCommas(hun_data.gyogyult_pest)}${numberWithCommas(statistics.gyogyult_pest_new)} / ${numberWithCommas(hun_data.gyogyult_videk)}${numberWithCommas(statistics.gyogyult_videk_new)}\n🏥 Hatósági házi karanténban: ${numberWithCommas(hun_data.hatosagi_karanten)} ${numberWithCommas(statistics.hatosagi_karanten_new)}\n🧪 Mintavételek száma: ${numberWithCommas(hun_data.mintavetel)}${numberWithCommas(statistics.fertozott_pest_new)}${attachment_status}`;
                    if (result.imgUrl) attachment_status = "";
                });
                res.on('end',()=>{
                    resolve(result);
                });
            });
            req.on('error', error => { console.log(host + " nem érhető el.") })
            req.end();
        } else {
            var cases = 0;
            var deaths = 0;
            var recovered = 0;
            var req = unirest("GET", "https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/stats");

            req.query({
                "country": country
            });

            req.headers({
                "x-rapidapi-host": "covid-19-coronavirus-statistics.p.rapidapi.com",
                "x-rapidapi-key": "ba898b1cf6msh168261419425c3cp171f77jsn5d7fc1872358",
                "useQueryString": true
            });

            req.end(function (res) {
                var stat = JSON.parse(res.raw_body).data.covid19Stats;
                var countryFound = false;
                if(Array.isArray(stat)){
                    stat.forEach((field)=>{
                        if (field.country === country) {
                            countryFound = true;
                            cases += field.confirmed;
                            deaths += field.deaths;
                            recovered += field.recovered;
                        }
                    });
                }else{
                    console.log("Rossz formátumú válasz hiba");
                }
                if(countryFound){
                    result.message = `🌍 ${country} jelenlegi koronavírus helyzete:\n\n🦠 Esetek: ${numberWithCommas(cases)}\n💀 Halál: ${numberWithCommas(deaths)}\n💚 Meggyógyult: ${numberWithCommas(recovered)}`;
                }else{
                    result.message = "Sajnos nem találtam ilyen országot. (A szóközzel rendelkező országnevek jelenleg nem támogatottak)"
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
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var webhook_schedule = new Schedule.scheduleJob(config.rule, sendWebhook)