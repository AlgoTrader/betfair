// (C) 2016 Anton Zemlyanov, rewritten in JavaScript 6 (ES6)
'use strict';

/*
 * This logger generates bunyan-compatible logs
 * use 'npm install -g bunyan' to install log formatter
 */

let os = require('os');
let _ = require('underscore');

const LOG_LEVELS = {
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    WARN: 40,
    ERROR: 50,
    FATAL: 60
};

class Logger {
    constructor(name, level = 'INFO', logs = []) {
        this.name = name;
        this.currentLogLevel = LOG_LEVELS[level];
        this.logs = logs;

        ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach((level) => {
            this[level] = (message, data) => {
                let logLevel = LOG_LEVELS[level.toUpperCase()];
                if (logLevel < this.currentLogLevel) {
                    return;
                }
                let logItem = {
                    name: this.name,
                    hostname: os.hostname(),
                    pid: process.pid,
                    level: logLevel,
                    msg: message,
                    time: Date.now()
                };
                if(data) {
                    _.extend(logItem, data);
                    this.logs.forEach((log) => {log.write(logItem)});
                }
            }
        });
    }

    flush() {
        this.logs.forEach((log) => {log.flush()});
    }
}

class FileLog {
    constructor(filename) {

    }

    write(data) {

    }

    flush() {

    }
}

class MemoryLog {
    constructor(limit = 256) {
        this.limit = limit;
        this.log = [];
    }

    write(data) {
        this.log.push()
    }

    flush() {

    }
}

module.exports = {
    Logger: Logger,
    FileLog: FileLog,
    MemoryLog: MemoryLog
};