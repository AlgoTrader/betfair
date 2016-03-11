let HttpRequest = require('./http_request.js');
let querystring = require('querystring');
let cookieJar = require('./cookie_jar.js');

const AUTH_URLS = {
    interactiveLogin: 'https://identitysso.betfair.com:443/api/login',
    botLogin: 'https://identitysso-api.betfair.com:443/api/certlogin',
    logout: 'https://identitysso.betfair.com:443/api/logout',
    keepAlive: 'https://identitysso.betfair.com:443/api/keepAlive'
};

class BetfairAuth {
    constructor() {
    }

    loginInteractive(login, password, cb = ()=> {}) {
        let formData = querystring.stringify({
            username: login,
            password: password,
            login: true,
            redirectMethod: 'POST',
            product: 'home.betfair.int',
            url: 'https://www.betfair.com/'
        });
        let options = {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                'content-length': formData.length,
                'x-application': 'BetfairAPI'
            }
        };
        HttpRequest.post(AUTH_URLS.interactiveLogin, formData, options, (err, res) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, {
                success: res.statusCode == 200,
                sessionId: cookieJar.get('ssoid'),
                duration: res.duration,
            });
        });
    }

    loginBot(login, password, options, cb = ()=> {}) {

    }

    logout(cb = ()=> {}) {

    }

    keepAlive(cb = ()=> {}) {

    }
}

module.exports = new BetfairAuth();