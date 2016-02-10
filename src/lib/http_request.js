'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const zlib = require('zlib');
const Stream = require('stream');
const _ = require('underscore');

// always used with BF API
const useGzipCompression = true;

class HttpRequest extends Stream {
    // get http request
    static get(url, cb, options = {}) {
        const opts = _.extend({
            url: url,
            method: 'get'
        }, options);
        return new HttpRequest(opts).execute(cb);
    }

    // post http request
    static post(url, data, cb, options) {
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
        this.rawResponseLength = 0;
        this.jsonResponseBody = '';
        this.parsedUrl = url.parse(options.url);
        this.method = options.method;
    }

    // do actual job
    execute(cb = () => {}) {
        this.callback = cb;
        const transport = this.parsedUrl.protocol === 'https:' ? https : http;
        const httpOptions = {
            host: this.parsedUrl.hostname,
            port: this.parsedUrl.port,
            path: this.parsedUrl.pathname,
            method: this.method,
            headers: {}
        };
        if (useGzipCompression) {
            httpOptions.headers['Accept-Encoding'] = 'gzip';
        }
        let request = transport.request(httpOptions, (result) => {
            console.log("statusCode: ", result.statusCode, "headers: ", result.headers);
            this.statusCode = result.statusCode;

            // just for stats
            result.on('data', (data) => {
                this.rawResponseLength += data.length;
            });
            result.on('error', (err) => {
                cb(err);
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
        request.on('error', (...args) => {
            console.log('error');
            this.callback('error');
        });
        if (this.method === 'post') {

        }
        request.end();
    }

    // http(s) chuck data
    write(data) {
        console.log(data);
        this.jsonResponseBody += data.toString();
    }

    // http(s) end of chunk data
    end() {
        // Compression efficiency results
        console.log(this.rawResponseLength, this.jsonResponseBody.length);
        let ratio = 100.0 - (this.rawResponseLength / this.jsonResponseBody.length) * 100.0;
        ratio = Math.round(ratio);

        console.log('end', ratio);
        this.callback(null, 'life is goood');
    }
}

module.exports = HttpRequest;

