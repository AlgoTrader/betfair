// (C) 2016 Anton Zemlyanov, rewritten in JavaScript 6 (ES6)
'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const zlib = require('zlib');
const Stream = require('stream');
const _ = require('lodash');

const cookieJar = require('./cookie_jar.js');

// always used with BF API
const USE_GZIP_COMPRESSION = true;
const NANOSECONDS_IN_SECOND = 1000000000;
const MAX_REQUEST_TIMEOUT = 15*1000;

const agentParams = {keepAlive: true, maxFreeSockets: 8};
const httpAgent = new http.Agent(agentParams);
const httpsAgent = new https.Agent(agentParams);

class HttpRequest extends Stream {
    // get http request
    static get(url, options = {}, cb = () => {}) {
        const opts = _.extend({
            url: url,
            method: 'get'
        }, options);
        return new HttpRequest(opts).execute(cb);
    }

    // post http request
    static post(url, data, options = {}, cb = () => {}) {
        const opts = _.extend({
            url: url,
            method: 'post',
            requestBody: data
        }, options);
        return new HttpRequest(opts).execute(cb);
    }

    // constructor
    constructor(options = {}) {
        super();

        // Stream stuff, HttpRequest is writable stream
        this.readable = false;
        this.writable = true;

        this.options = options;
        this.rawResponseLength = 0;
        this.responseBody = '';
        this.parsedUrl = url.parse(options.url);
        this.method = options.method;
    }

    // do actual job
    execute(cb = () => {
    }) {
        this.callback = cb;
        const transport = this.parsedUrl.protocol === 'https:' ? https : http;
        let httpOptions = {
            agent: (this.parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent),
            host: this.parsedUrl.hostname,
            port: this.parsedUrl.port,
            path: this.parsedUrl.pathname,
            method: this.method,
            headers: this.options.headers || {},
            rejectUnauthorized: false
        };
        _.extend(httpOptions.headers, this.options.headers);
        httpOptions.headers.cookie = cookieJar.serialize();
        if (USE_GZIP_COMPRESSION) {
            httpOptions.headers['accept-encoding'] = 'gzip';
        }
        httpOptions.headers.cookie = cookieJar.serialize();

        let request = transport.request(httpOptions, (result) => {
            //console.log("statusCode: ", result.statusCode, "headers: ", result.headers);
            this.statusCode = result.statusCode;
            this.contentType = result.headers['content-type'];
            this.cookies = result.headers['set-cookie'];
            cookieJar.parse(this.cookies);

            // just for stats
            result.on('data', (data) => {
                this.rawResponseLength += data.length;
            });
            result.on('error', (err) => {
                this.callback(err);
            });

            // http request input to self output
            if (result.headers['content-encoding'] === 'gzip') {
                // piping through gzip
                let gunzip = zlib.createGunzip();
                result.pipe(gunzip).pipe(this);
            } else {
                // piping directly to self
                result.pipe(this);
            }
        });
        request.on('error', (err) => {
            this.callback(err);
        });
        // request.on('socket', function (socket) {
        //     socket.setTimeout(MAX_REQUEST_TIMEOUT);
        //     socket.on('timeout', function() {
        //         request.abort();
        //     });
        // });
        request.setTimeout(MAX_REQUEST_TIMEOUT, () => {
            request.abort();
            //this.callback('REQUEST_TIMEOUT');
        });
        if (this.method === 'post') {
            request.write(this.options.requestBody);
        }
        this.startTime = process.hrtime();
        request.end();
    }

    // http(s) chuck data
    write(data) {
        this.responseBody += data.toString();
    }

    // http(s) end of chunk data
    end() {
        // duration
        this.endTime = process.hrtime();
        let start = this.startTime[0] + (this.startTime[1] / NANOSECONDS_IN_SECOND);
        let end = this.endTime[0] + (this.endTime[1] / NANOSECONDS_IN_SECOND);

        // gzip compression efficiency
        let responseBodyLength = this.responseBody.length;
        let ratio = 100.0 - (this.rawResponseLength / responseBodyLength) * 100.0;
        ratio = Math.round(ratio);

        // if JSON, parse JSON into JS object
        if (this.contentType === 'application/json') {
            try {
                this.responseBody = JSON.parse(this.responseBody);
            } catch (error) {
                this.responseBody = {
                    error: 'Bad JSON'
                };
            }
        }

        this.callback(null, {
            statusCode: this.statusCode,
            contentType: this.contentType,
            responseBody: this.responseBody,
            cookies: this.cookies,
            length: responseBodyLength,
            compressionRation: ratio,
            duration: Math.round((end - start) * 1000)
        });
    }
}
module.exports = HttpRequest;
