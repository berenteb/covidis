'use strict';
const Discord = require('discord.js');
const unirest = require('unirest');
const config = require('./config.json');
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
            switch (country) {
                case "WORLD":
                    createRequestWorld(message.channel);
                    break;
                default:
                    createRequest(country, message.channel);
                    break;
            }
        }
    } else if (message.content === "!info") {
        message.react('❤');
        message.channel.send("Hello!\nCOVidis bot vagyok és felcsatlakoztam. Ha tetszik, ha nem...\nOrszágokról küldök koronavírus információkat.\n\nHasználat:\n\t'!covid:<ország>'\n\t'!mask'");
    } else if (message.content === "!mask") {
        message.react('❤');
        getMask(message.channel);
    }
});

client.login(config.token);

//Countries other than World and US
function createRequest(country, channel) {

    console.log(country + " keresése");
    var cases = 0;
    var new_cases = 0;
    var deaths = 0;
    var new_deaths = 0;
    var recovered = 0;
    var serious_critical = 0;
    var total_cases_per_million = 0;
    var attachment = null;
    var attachment_status = "";

    if (country === "HUNGARY") {
        var d = new Date();
        var day = d.getDate();
        var dayString = day<10?"0"+day:day+"";
        var month = d.getMonth()+1;
        var monthString = month<10?"0"+month:month+"";
        var host = "koronavirus.gov.hu"
        var path = `/sites/default/files/terkep${monthString}${dayString}.jpg`;
        var imgUrl = `http://${host}${path}`;
        try{
            attachment = new Discord.MessageAttachment(imgUrl);
            console.log("Térkép letöltve");
        }catch(error){
            console.log(url+" nem található.");
            attachment_status = "\nItt egy térképnek kellene megjelennie, de azzal még titkolózik a kormány.\nPróbáld újra később!"
            console.log(error);
        }   
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
        var message = "Nincs adatom erről 😓";
        if (countryFound) {
            console.log("Sikeres! Válasz elküldve");
            message = `🌍 ${country} jelenlegi koronavírus helyzete:\n\n📄 Esetek: ${cases} (mai nap: +${new_cases})\n💀 Halál: ${deaths} (mai nap: +${new_deaths})\n🆘 Súlyos beteg: ${serious_critical}\n💚 Meggyógyult: ${recovered}\n🔢 1 Millió főre eső eset: ${total_cases_per_million}${attachment_status}`;
        } else {
            console.log("Nincs találat! Információ elküldve");
        }
        channel.send(message, attachment);
    });
}

function createRequestWorld(channel) {

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

