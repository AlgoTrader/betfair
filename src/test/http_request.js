var HttpRequest = require('../lib/http_request.js');

HttpRequest.get('https://www.betfair.com/exchange', (...args) => {console.log(args)});