Betfair API-NG for Node.js
================================================

[![NPM](https://nodei.co/npm/betfair.png?downloads=true)](https://nodei.co/npm/betfair/)

## Installation ##

    npm install betfair

or

    git clone git@github.com:AlgoTrader/betfair.git
    cd betfair
    npm install
    npm run build

betrair API was completly rewritten in ES2015 and requires build step before usage

## Synopsis ##

Login to Betfair
```JavaScript
var betfair = require('betfair');
var session = new betfair.BetfairSession('yourApllicationKey');

session.login('name','password', function(err) {
    console.log(err ? "Login failed " + err : "Login OK");
});
```

Request countries list
```JavaScript
var invocation = session.listCountries({filter: {}}, function(err,res) {
    if(err) {
        console.log('listCountries failed');
    } else {
        for(var index in res.response.result) {
            var item = res.response.result[index];
            console.log("country:%s markets:%s", item.counrtyCode, item.marketCount)
        }
    }
});
```

Logout from Betfair
```JavaScript
session.logout(function(err) {
    console.log(err ? "Logout failed: " + err : "Logout OK");
});
```
