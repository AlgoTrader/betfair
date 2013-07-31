// (C) 2013 Anton Zemlyanov
// Betfair authorization
// Implements both "interactive" and "bot" auth methods

var https = require('https');
var querystring = require('querystring');
var url = require('url');

var interactiveConfig = {
    authHost: 'https://identitysso.betfair.com',
    loginUrl: '/api/login?product=www.betfair.int&url=https://www.betfair.com',
    logoutUrl: '/api/logout?product=www.etfair.int&url=https://www.betfair.com',
    keepAliveUrl: '/api/keepAlive'
};

var botConfig = {
    authHost: 'https://identitysso-api.betfair.com',
    loginURL: '/api/certlogin',
    logoutURL: null,
    keepAliveURL: null
};

function interactiveLogin(login, password, cb) {
    var options = url.parse(interactiveConfig.authHost + interactiveConfig.loginUrl);
    options.method = 'POST';
    var req = https.request(options, function(res) {
        // response data is out of interest, we need cookie ssoid
        console.log(res.headers);
    });
    var formData = {
        username: login,
        password: password,
        login: true,
        redirectMethod: 'POST',
        product: 'www.mysite.com',
        url: 'https://www.betfair.com/'
    }
    var data = querystring.stringify(formData);
    console.log(data);
    req.end(data);
}

function interactiveLogout(cb) {
}

function interactiveKeepAlive(cb) {
}

module.exports = {
    interactiveLogin: interactiveLogin
};
