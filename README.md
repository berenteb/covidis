# COVidis
Discord Bot responding with Coronavirus Numbers and Information.
# Data Source
<<<<<<< Updated upstream
* Hungary: [Atlo](http://atlo.team), [Map](http://koronavirus.gov.hu)
* For other countries: [Coronavirus-Statistics/RapidAPI](https://rapidapi.com/KishCom/api/covid-19-coronavirus-statistics)
# Config required
## config.json
```json
{
    "token":<your token>,
    "webhook": <webhook url>,
    "rule": <daily data sending rule (node-schedule)>,
    "sheetID": <your Google Sheets ID>
}
```
## row_indexes.json
Latest data for Hungary is returned in an array. This file contains the index for each data field.
## credentials.json
Google Auth credentials. It can be downloaded from the Google Cloud Console.
## token.json
Token file for the Sheets API. If it doesn't exist, you'll be asked to visit a URL, and paste the code from the redirect URL. Then the new token will be stored.
=======
* For Hungary: [Atlo](http://atlo.team), [Map](http://koronavirus.gov.hu)
* For others: [Coronavirus-Statistics](https://rapidapi.com/KishCom/api/covid-19-coronavirus-statistics)
# Settings
## config.json
```json
{
    "token":<your Discord token>,
    "webhook": <Discord webhook url>,
    "rule": <daily data sending rule (node-schedule, cron)>,
    "sheetID": <Google Sheets ID>
}
```
## credentials.json
This file can be downloaded from the Google Cloud Console.
## token.json
This file is created by the Google Authentication process, contains the token for the Sheets API. When it doesn't exist, there'll be instructions in the console to obtain this token. Since there's no redirect URL for the authentication, the code that should be written in the console will appear in the (localhost) url.
## row_indexes.json
The Google Sheets API returns a row as an array. This file contains the indexes for each data field.
>>>>>>> Stashed changes
# ISC License (ISC)
Copyright 2020 Bálint Berente

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
