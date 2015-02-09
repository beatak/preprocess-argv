'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var PROJECT_ROOT = path.join(__dirname, '..');
var SRC_DIR = path.join(PROJECT_ROOT, 'src');
var TEST_DIR = path.join(PROJECT_ROOT, 'test');
var HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var normalize_path = require(path.join(SRC_DIR, 'normalize_path.js'));
var variation = require(path.join(TEST_DIR, 'type_variation.js'));

describe('normalize_path', function () {
    it('should fail with wrong type arguments', function () {
        Object.keys(variation).forEach(function (key) {
            assert.throws(
                function () {
                    normalize_path(variation[key]);
                },
                /ArgumentError/
            );
        });
    });

    it('should fail if it is passed a string with a tilde in the middle -- just not supported', function () {
        assert.throws(
            function () {
                normalize_path('/foo/bar/~/beatak/development');
            },
            /ArgumentError/
        );
    });

    // success test
    if (undefined === HOME) {
        console.error('This process does not have the home directory registered in env. In order to test `normalize_path`, it is needed. Aborting the test.');
        return;
    }

    it('should expand one tilde only path as a home directory', function () {
        assert.strictEqual(normalize_path('~'), HOME);
        assert.strictEqual(normalize_path('~' + path.sep), HOME);
    });

    it('should expand one tilde + path', function () {
        assert.strictEqual(
            normalize_path('~' + path.sep + 'development'),
            path.join(HOME, 'development')
        );
    });


    it('should expand the path begins with / as an absolute path', function () {
        assert.strictEqual(
            normalize_path(path.sep),
            path.sep
        );
        assert.strictEqual(
            normalize_path(path.sep + 'var'),
            path.sep + 'var'
        );
    });

    it('should expand the path does not begin with / as a relative path from process\' cwd', function () {
        var cwd = process.cwd();
        assert.strictEqual(
            normalize_path('foobar'),
            path.join(cwd, 'foobar')
        );
    });
});

