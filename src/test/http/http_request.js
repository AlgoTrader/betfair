var HttpRequest = require('../../lib/http_request.js');

HttpRequest.get('https://www.betfair.com/exchange', {}, (error, result) => {
    console.log(result.statusCode, result.contentType, result.responseBody.length, result.duration);
});