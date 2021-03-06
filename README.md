# COVidis
![Version](https://img.shields.io/github/package-json/v/berenteb/covidis)
Discord Bot responding with Coronavirus Numbers and Information.
# Data Source
* Hungary: [Atlo](http://atlo.team), [Map](http://koronavirus.gov.hu)
* For other countries: [Coronavirus-Statistics/RapidAPI](https://rapidapi.com/KishCom/api/covid-19-coronavirus-statistics)
# Config required
## config.json
```json
{
    "token":<Discord token>,
    "webhook": <WebHook URL>,
    "rule": <automated WebHook cron rule>,
    "rapid_api_key": <...>,
    "sheetID": <Google Sheet ID>,
    "pushover_token": <...>,
    "pushover_user": <...>,
    "redirect_url": <Used for Google Authentication>,
    "webserver_port": <Used for Google Authentication>,
    "redirect_url_with_port": <whether rhe redirect URL should contain the webserver port. Good for testing. (optional)>
}
```
## row_indexes.json
Latest data for Hungary is returned in an array. This file contains the index for each data field.
## credentials.json
Google Auth credentials. It can be downloaded from the Google Cloud Console.
## token.json
Token file for the Sheets API. If it doesn't exist, you'll be asked to visit a URL, and paste the code from the redirect URL. Then the new token will be stored.
