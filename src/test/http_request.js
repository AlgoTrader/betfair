var HttpRequest = require('../lib/http_request.js');

HttpRequest.get('http://www.betfair.com', (...args) => {console.log(args)});