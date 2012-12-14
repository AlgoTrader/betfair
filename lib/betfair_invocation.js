//(C) 2012 Anton Zemlyanov

//This module implements a generic Betfair Sports API invocation (SOAP protocol)
//see Sports API documentation on http://bdp.betfair.com

var url = require('url');
var https = require('https');
var util = require('util');
var events = require('events');
var Stream = require('stream');
var zlib = require('zlib');

var ForeverAgentSSL = require('../util/forever.js').SSL;
var foreverAgentSSL = new ForeverAgentSSL({
    maxSockets : 36,
    minSockets : 16
});

var useGzipCompression = true;
var betfairPort = 443;
var id = 1;
var apiType = "SportsAPING";
var apiVersion = "v1.0";

var service = "https://beta-api.betfair.com/json-rpc";

exports.newInvocation = newInvocation;
exports.applicationKey = null;

function newInvocation(sessionKey, method, params) {
    return new BetfairInvocation(sessionKey,method, params);
}

function BetfairInvocation(sessionKey,method, params) {
    var self = this;

    self.service = service;
    self.sessionKey = sessionKey;
    self.method = method;
    self.params = params || {};
   
    self.request = {
       "jsonrpc":"2.0", 
       "id":id++, 
       "method": apiType+'/'+apiVersion+'/'+self.method,
       "params" : self.params
    };
    self.response = null;

    // Stream stuff, BetfairInvocation is writable stream
    self.readable = false;
    self.writable = true;

    self.startDate = new Date();
    
    self.rawResponseLength = 0;
    self.jsonRequestBody = "";
    self.jsonResponseBody = "";
}
util.inherits(BetfairInvocation, Stream);

BetfairInvocation.prototype.execute = function(callback) {
    var self = this;
    self.callback = callback || function() {
    };

    var parsedUrl = url.parse(this.service);
    var httpOptions = {
        host : parsedUrl.hostname,
        port : betfairPort,
        path : parsedUrl.pathname,
        method : 'POST',
        agent : foreverAgentSSL,
        forever : true,
        headers : {
            'X-Application' : exports.applicationKey,
            'X-Authentication' :'"'+self.sessionKey+'"',
            "Content-Type" : 'application/json',
            'Connection' : 'keep-alive'
        }
    };
    // Optional GZIP compression
    if (useGzipCompression)
        httpOptions.headers['Accept-Encoding'] = 'gzip';
        
    function responseCallback(res) {
        //console.log("statusCode: ", res.statusCode, "headers: ",res.headers);
        self.statusCode = res.statusCode;

        // just for stats
        res.on('data', function(data) {
            self.rawResponseLength += data.length;
        })

        // http request input to self output
        if (res.headers['content-encoding'] === 'gzip') {
            // piping through gzip
            var gunzip = zlib.createGunzip();
            res.pipe(gunzip).pipe(self);
        } else {
            // piping directly to self
            res.pipe(self);
        }
    }

    // issue HTTPS method
    var req = https.request(httpOptions, responseCallback);

    // send json data
    self.jsonRequestBody = JSON.stringify(self.request);
    req.write(self.jsonRequestBody);
    req.end();
}

BetfairInvocation.prototype.write = function(data) {
    var self = this;
    self.jsonResponseBody += data.toString();
};

BetfairInvocation.prototype.end = function() {
    var self = this;

    // Compression efficiency results
    var ratio = 100.0 - (self.rawResponseLength / self.jsonResponseBody.length) * 100.0;
    ratio = Math.round(ratio);
    console.log('%s response: raw length=%d, json length=%d, compression=%d%',
        self.method, self.rawResponseLength, self.jsonResponseBody.length, ratio);
    
    try {
        self.response = JSON.parse(self.jsonResponseBody);
    } catch(err) {
        self.response = { error: "Got bad JSON from server" };
    }
    self.finishDate = new Date;

    if (self.response.error) {
        self.callback(self.response.error, self);
    } else {
        self.callback(null, self);
    }
};

BetfairInvocation.prototype.isSuccess = function() {
    return self.response && self.response.result;
}

BetfairInvocation.prototype.isFailure = function() {
    return !self.response || !self.response.result;
}

BetfairInvocation.prototype.duration = function() {
    // Convert both dates to milliseconds
    var start = this.startDate;
    var finish = this.finishDate;

    // return the difference in milliseconds
    return finish - start;
}
