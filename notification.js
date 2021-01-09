var Push = require( 'pushover-notifications' )
const config = require('./config.json');
 
var p = new Push( {
  user: config.pushover_user,
  token: config.pushover_token,
  onerror: function(error) {
      console.log("Pushover hiba!");
  }
})

function sendNotification(message, title, url=""){
    var msg = {
        message: message,
        title: title,
        url: url
    }
    p.send(msg, function(err) {
        if ( err ) {
            console.log("Nem sikerült elküldeni az értesítést: "+err);
        }
        console.log("Értesítés elküldve")
      })
}

module.exports = sendNotification;