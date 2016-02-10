'use strict';

let http = require('http');
let https = require('https');
let url = require('url');
let _ = require('underscore');

// always used with BF API
const useGzipCompression = true;

class HttpRequest {
    static get(url, cb, options = {}) {
        let opts = _.extend({
            url: url,
            method: 'get'
        }, options);
        return new HttpRequest(opts).execute(cb);
    }
    static post(url, data, cb, options) {
        let opts = _.extend({
            url: url,
            method: 'post',
            data: data
        }, options);
        return new HttpRequest(opts).execute(cb);
    }
    constructor(options = {}) {
        this.uri = url.parse(options.url);
    }
    execute(cb = () => {}) {
        console.log(this);
        cb(null);
    }
}

module.exports = HttpRequest;

