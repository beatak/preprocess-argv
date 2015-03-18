'use strict';

var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var normalize_path = require(path.join(__dirname, 'src', 'normalize_path'));
var SILENT_OPT = {silent: true};
var debug = false;

/**
 * @param inputs [Array|String]
 * @param opt [Object] (optional) recognizing options as [dont_check_exist, expand_dir, allow_dir, allow_dotfiles]
 */
var preprocess_argv = function (inputs, opt) {
    var result, er;

    if ('string' !== typeof inputs && !Array.isArray(inputs)) {
        er = new Error('`inputs` needs to be eitner a string or an array');
        er.name = 'ArgumentError';
        throw er;
    }
    if (opt !== undefined && ('object' !== typeof opt || null === opt)) {
        er = new Error('`opt` is optional, but if you pass it, it needs to be an object (not null, nor array)');
        er.name = 'ArgumentError';
        throw er;
    }

    result = [];
    opt = opt || {};
    if (debug) {
        console.error('preprocess_argv:', inputs, opt);
    }

    if ('string' === typeof inputs) {
        result = process_path(inputs, opt)[0];
    }
    else if (Array.isArray(inputs)) {
        inputs.forEach(function (mypath) {
            var r = process_path(mypath, opt);
            if (r.length) {
                result = result.concat(r);
            }
        });
    }

    return result;
};

var process_path = function (mypath, opt) {
    var stats,
        _path = normalize_path(mypath),
        result = [];
    if (debug) {
        console.error('processing: ' + _path);
    }

    if (opt.dont_check_exist) {
        result.push(_path);
    }
    else {
        if (fs.existsSync(_path)) {
            stats = fs.statSync(_path);
            if (stats.isDirectory()) {
                if (opt.expand_dir) {
                    result = result.concat(exec_find(_path, opt));
                } else if (opt.allow_dir) {
                    result.push(_path);
                }
            }
            else {
                if (opt.allow_dotfiles || 0 !== path.basename(_path).indexOf('.')) {
                    result.push(_path);
                }
            }
        }
    }
    return result;
};

/**
 * @param dir_path {String}
 * @param opt {Object} recognizing options as [allow_dir, allow_dotfiles]
 */
var exec_find = function (dir_path, opt) {
    var output, debug_message,
        result = [],
        command = ['find ', dir_path];

    if (!opt.allow_dir) {
        command.push(' -type f');
    }
    if (!opt.allow_dotfiles) {
        command.push(' | grep -v "\\\/\\\."');
    }

    output = shell.exec(command.join(''), SILENT_OPT);
    if (debug) {
        console.error('exec_find:', dir_path, opt, command.join(''));
        console.error(output);
    }
    
    if (0 === output.code) {
        result = output.output.trim().split('\n');
    }
    else {
        if (debug) {
            debug_message = ['Find command failed:\n'];
            debug_message.push('--------------------\n');
            debug_message.push('command: ');
            debug_message.push(command.join(''));
            debug_message.push('\nerror code: ');
            debug_message.push(output.code);
            debug_message.push('\nmessage:\n');
            debug_message.push(output.output);
            console.error(debug_message.join(''));
        }
    }

    return result;
};

Object.defineProperty(
    preprocess_argv,
    'debug',
    {
        get: function () {
            return debug;
        },
        set: function (v) {
            if ('boolean' === typeof v) {
                debug = v;
            }
        }
    }
);

module.exports = preprocess_argv;

