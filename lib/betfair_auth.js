// (C) 2013 Anton Zemlyanov
// Betfair authorization
// Implements both "interactive" and "bot" auth methods

var https = require('https');
var querystring = require('querystring');
var url = require('url');

var interactiveConfig = {
    authHost: 'https://identitysso.betfair.com',
    //loginUrl: '/api/login?product=www.betfair.int&url=https://www.betfair.com',
    loginUrl: '/api/login',
    logoutUrl: '/api/logout?product=www.betfair.int&url=https://www.betfair.com',
    keepAliveUrl: '/api/keepAlive'
};

var botConfig = {
    authHost: 'https://identitysso-api.betfair.com',
    loginURL: '/api/certlogin',
    logoutURL: null,
    keepAliveURL: null
};

function interactiveLogin(login, password, cb) {
    var formData = {
        username: login,
        password: password,
        login: true,
        redirectMethod: 'POST',
        product: 'home.betfair.int',
        url: 'https://www.betfair.com/'
    }
    var data = querystring.stringify(formData);
    console.log(data);

    var options = url.parse(interactiveConfig.authHost + interactiveConfig.loginUrl);
    options.method = 'POST';
    options.headers = {
       "Content-Type": "application/x-www-form-urlencoded",
       "Content-Length": data.length
    };
    var req = https.request(options, function(res) {
        // response data is out of interest, we need cookie ssoid
        console.log(req.headers, res.headers);
        if(res.statusCode==200)
           cb(null, {duration:123, ssoid:"noneyet"});
        else
           cb({error: "bad HTTP code"+res.statusCode});
    });
    req.end(data);
}

function interactiveLogout(cb) {
}

function interactiveKeepAlive(cb) {
}

module.exports = {
    interactiveLogin: interactiveLogin
};
