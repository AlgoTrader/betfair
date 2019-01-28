Betfair API-NG for Node.js promisified. 
================================================

[![NPM](https://nodei.co/npm/betfair-promise.png?downloads=true)](https://nodei.co/npm/betfair-promise/)



Based in [AlgoTrader betfair](https://github.com/AlgoTrader/betfair) project.



## Installation ##

    npm install betfair-promise --save


## Synopsis ##

Login to Betfair
```JavaScript
const betfair = require('betfair-promise');
const session = new betfair.BetfairSession("yourAppKey");

const testLoging = async () => {
    try {
        await session.login("yourUsername", "yourPassword");
        await session.keepAlive();
        await session.logout();
    } catch(error) {
        console.log("Something was wrong");
        console.log(error);
    }
};

testLoging();
```


If you need to set different Betfair endpoints (Spain, Italy ... check here: [countries endpoints](https://docs.developer.betfair.com/display/1smk3cen4v3lu3yomq5qye0ni/Interactive+Login+-+API+Endpoint#InteractiveLogin-APIEndpoint-OtherJurisdictions)), init Betfair session with this options:


```JavaScript
const betfair = require('betfair-promise');

// Spain URL's
const AUTH_URLS_ES = {
    interactiveLogin: 'https://identitysso.betfair.es:443/api/login',
    botLogin: 'https://identitysso-api.betfair.es:443/api/certlogin',
    logout: 'https://identitysso.betfair.es:443/api/logout',
    keepAlive: 'https://identitysso.betfair.es:443/api/keepAlive'
};

const session = new betfair.BetfairSession("yourAppKey", {authUrls: AUTH_URLS_ES});
```



Request countries list

```JavaScript
const betfair = require('betfair-promise');
const session = new betfair.BetfairSession("yourAppKey");

const testListOfCountries = async () => {
    await session.login("yourUsername", "yourPassword");
    var listOfCountries = await session.listCountries({filter: {}});
    for(let country of listOfCountries.result) {
        console.log("country:%s markets:%s", country.countryCode, country.marketCount);
    }
};

testListOfCountries();
```

A further list of commands, like above, can be found at the [Betfair Betting API](https://docs.developer.betfair.com/display/1smk3cen4v3lu3yomq5qye0ni/Betting+API) page.
