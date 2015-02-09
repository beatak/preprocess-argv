'use strict';

var path = require('path');
var shell = require('shelljs');

var HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var DIR_USER_BASE;
var CWD = process.cwd();

var expand_tilde = function (str) {
    var shellresult, result, idx;

    if (undefined === HOME) {
        shellresult = shell.exec('cd ~ && pwd');
        if (0 !== shellresult.code) {
            throw new Error('failed to execute `cd ~ && pwd`');
        }
        HOME = shellresult.output.trim();
    }

    if (undefined === DIR_USER_BASE) {
        DIR_USER_BASE = HOME.split(path.sep).slice(0, -1).join(path.sep);
    }

    if (1 === str.length) {
        result = HOME;
    }
    else if (path.sep === str[1]) {
        result = path.join(HOME, str.slice(2));
    }
    else {
        idx = str.indexOf('/');
        result = path.join(DIR_USER_BASE, str.slice(1));
    }

    return result;
};

module.exports = function (str) {
    var er, result, idx;
    if ('string' !== typeof str) {
        er = new Error('str needs to be a string, obviously');
        er.name = 'ArgumentError';
        throw er;
    }
    idx = str.indexOf('~');
    if (0 < idx) {
        er = new Error('this does not support tilde in the middle');
        er.name = 'ArgumentError';
        throw er;
    }
    else if (0 === idx) {
        result = expand_tilde(str);
    }
    else {
        result = path.resolve(CWD, str);
    }
    return result;
};
