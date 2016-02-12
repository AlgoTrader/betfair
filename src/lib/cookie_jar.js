const _ = require('underscore');

class CookieJar {
    constructor() {
        this.cookies = {};
    }

    // serialize the whole jar
    serialize() {
        var cookies = [];
        _.each(this.cookies, (value, name) => {
            cookies.push(cookie.serialize(name, value));
        })
        return cookies.join('; ');
    }

    // parse string and add cookies to cookie var
    parse(cookies) {
        console.log('!', cookie.parse(cookies));
        _.extend(this.cookies, cookie.parse(cookies));
    }

    // get cookie from jar
    get(name) {
        return this.cookies[name];
    }

    // store cookie to jar
    set(name, value, options) {
        cookie.serialize(name, value, options)
    }
}

module.exports = new CookieJar();
