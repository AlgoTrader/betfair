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
       "jsonrpc":"2,0", 
       "id":id++, 
       "method": apiType+'/'+apiVersion+'/'+self.method,
       "params" : self.params
    };
    self.result = null;

    // Stream stuff, BetfairInvocation is writable stream
    self.readable = false;
    self.writable = true;

    self.startDate = new Date();
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
            "Content-type" : 'application/json'
        }
    };
    // Optional GZIP compression
    if (useGzipCompression)
        httpOptions.headers['accept-encoding'] = 'gzip';
        
    function responseCallback(res) {
        console.log("statusCode: ", res.statusCode, "headers: ",res.headers);
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
    console.log(httpOptions);
    var req = https.request(httpOptions, responseCallback);

    var json = JSON.stringify(self.request);
    console.log(json);
    req.write(json);
    req.end();
}

BetfairInvocation.prototype.write = function(data) {
    var self = this;
    self.jsonResponseBody = self.jsonResponseBody || "";
    self.jsonResponseBody += data.toString();
    console.log(self.jsonResponseBody);
};

BetfairInvocation.prototype.end = function() {
    var self = this;

    // Compression efficiency results
    var ratio = 100.0 - (self.rawResponseLength / self.jsonResponseBody.length) * 100.0;
    ratio = Math.round(ratio);
     console.log('%s response: raw length=%d, xml length=%d, compression=%d%',
     self.method,
     self.rawResponseLength, self.jsonResponseBody.length, ratio);
    
    try {
        self.result = JSON.parse(self.jsonResponseBody);
    } catch(err) {
        self.result = { error: "Got bad JSON from server" };
    }
    self.finishDate = new Date;

    if (self.result.error) {
        self.callback(self.result.error, self);
    } else {
        self.callback(null, self);
    }
};

BetfairInvocation.prototype.isSuccess = function() {
    throw "Not yet done";
}

BetfairInvocation.prototype.isFailure = function() {
    throw "Not yet done";
}

BetfairInvocation.prototype.duration = function() {
    // Convert both dates to milliseconds
    var start = this.startDate;
    var finish = this.finishDate;

    // return the difference in milliseconds
    return finishMs - startMs;
}
