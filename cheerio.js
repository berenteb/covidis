const https = require('https');
const cheerio = require('cheerio');
var req = https.request({hostname: "koronavirus.gov.hu"},(res)=>{
    res.on('data',(d)=>{
        var $ = cheerio.load(d);
        var number = $('.views-row-5').find(".number").text();
        try{
            number = number.replace(" ",",");
        }catch(e){
            number = "Érvénytelen adat";
        }
        var label = $('.views-row-5').find(".label").text();
        if(number!==""&&label!=="")console.log(`${label}: ${number}`);
        number = $('.views-row-4').find(".number").text();
        try{
            number = number.replace(" ",",");
        }catch(e){
            number = "Érvénytelen adat";
        }
        label = $('.views-row-4').find(".label").text();
        if(number!==""&&label!=="")console.log(`${label}: ${number}`);
    })
});

req.end();

