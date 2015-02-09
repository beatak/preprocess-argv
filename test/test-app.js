'use strict';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var shell = require('shelljs');

var PROJECT_ROOT = path.join(__dirname, '..');
var SRC_DIR = path.join(PROJECT_ROOT, 'src');
var TEST_DIR = path.join(PROJECT_ROOT, 'test');
var CASES_DIR = path.join(TEST_DIR, 'cases');

var preprocess_argv = require(path.join(PROJECT_ROOT, 'preprocess_argv.js'));
var variation = require(path.join(TEST_DIR, 'type_variation.js'));
// preprocess_argv.debug = true;

describe('preprocess_argv', function () {
    var temp = os.tmpdir();
    var seed = ('' + Date.now()).slice(-6);
    var temp_dir_name = 'test-preprocess-path-' + seed;
    var temp_dir = path.join(os.tmpdir(), temp_dir_name);
    var result_map = function (elm, i) {
        return elm.substring(temp_dir.length + 1);
    };

    before(function () {
        shell.cp('-R', CASES_DIR, temp);
        shell.mv(path.join(temp, 'cases'), temp_dir);
    });

    after(function () {
        shell.rm('-rf', temp_dir);
    });
    
    it('should fail with wrong type arguments', function () {
        Object.keys(variation).forEach(function (k1) {
            if ('Array' === k1 || 'String' === k1) {
                return;
            }
            Object.keys(variation).forEach(function (k2) {
                if ('Undefined' === k2 || 'Object' === k2) {
                    return;
                }
                assert.throws(
                    function () {
                        preprocess_argv(variation[k1], variation[k2]);
                    },
                    /ArgumentError/
                );
            });
        });
    });

    /**
     * default_options = {
     *     dont_check_exist: false,
     *     expand_dir: false,
     *     allow_dir: false,
     *     allow_dotfiles: false
     * };
     */
    it('should test dont_check_exist option', function () {
        var mypath = 'things_dont_exist_' + seed;
        var result_true = preprocess_argv(mypath, {dont_check_exist: true});
        var result_false = preprocess_argv(mypath, {dont_check_exist: false});
        assert.deepEqual(
            result_true,
            [path.join(process.cwd(), mypath)]
        );
        assert.deepEqual(
            result_false,
            []
        );
    });

    it('should test expand_dir option', function () {
        var mypath = temp_dir;
        var result_true = preprocess_argv(mypath, {expand_dir: true}).map(result_map);
        var result_false = preprocess_argv(mypath, {expand_dir: false}).map(result_map);

        assert.deepEqual(
            result_true.sort(),
            ['another_dir/fubar.txt', 'bar.txt'].sort()
        );
        assert.deepEqual(
            result_false,
            []
        );
    });

    it('should test allow_dir option', function () {
        var mypath = temp_dir;
        var result_true = preprocess_argv(mypath, {allow_dir: true}).map(result_map);
        var result_false = preprocess_argv(mypath, {allow_dir: false}).map(result_map);

        assert.deepEqual(
            result_true.sort(),
            ['']
        );
        assert.deepEqual(
            result_false,
            []
        );
    });

    it('should test allow_dotfiles option', function () {
        var mypath = temp_dir;
        var result_true = preprocess_argv(mypath, {expand_dir: true, allow_dotfiles: true}).map(result_map);
        var result_false = preprocess_argv(mypath, {expand_dir: true, allow_dotfiles: false}).map(result_map);
        // console.log('result:', result_true, result_false);
        assert.deepEqual(
            result_true.sort(),
            ['.dotdir/foo.txt', '.dotfile', 'another_dir/fubar.txt', 'bar.txt'].sort()
        );
        assert.deepEqual(
            result_false.sort(),
            ['another_dir/fubar.txt', 'bar.txt'].sort()
        );
    });

    it('should test multi_input', function () {
        var mypath = [
            path.join(temp_dir, 'bar.txt'),
            path.join(temp_dir, 'another_dir')
        ];
        var result_true = preprocess_argv(mypath, {expand_dir: true}).map(result_map);
        var result_false = preprocess_argv(mypath, {expand_dir: false}).map(result_map);
        // console.log('result:', result_true, result_false);
        assert.deepEqual(
            result_true.sort(),
            ['another_dir/fubar.txt', 'bar.txt'].sort()
        );
        assert.deepEqual(
            result_false,
            ['bar.txt']
        );
    });
});

