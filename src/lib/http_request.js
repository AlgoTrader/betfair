'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const zlib = require('zlib');
const Stream = require('stream');
const _ = require('underscore');

// always used with BF API
const USE_GZIP_COMPRESSION = true;
const NANOSECONDS_IN_SECOND = 1000000000;

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
            data: data
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
        const httpOptions = {
            agent: (this.parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent),
            host: this.parsedUrl.hostname,
            port: this.parsedUrl.port,
            path: this.parsedUrl.pathname,
            method: this.method,
            headers: {}
        };
        if (USE_GZIP_COMPRESSION) {
            httpOptions.headers['accept-encoding'] = 'gzip';
        }

        let request = transport.request(httpOptions, (result) => {
            console.log("statusCode: ", result.statusCode, "headers: ", result.headers);
            this.statusCode = result.statusCode;
            this.contentType = result.headers['content-type'];

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
        if (this.method === 'post') {
            request.write(this.options.body);
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

        // Compression efficiency results
        let ratio = 100.0 - (this.rawResponseLength / this.responseBody.length) * 100.0;
        ratio = Math.round(ratio);

        console.log('compression ratio:', ratio);

        this.callback(null, {
            statusCode: this.statusCode,
            contentType: this.contentType,
            responseBody: this.responseBody,
            compressionRation: ratio,
            duration: Math.round((end - start) * 1000)
        });
    }
}
module.exports = HttpRequest;
