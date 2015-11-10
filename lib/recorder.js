var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('lodash');

(function() {
    'use strict';

    /**
     * Pads integer with zeroes
     * 
     * @param  {Number} n   Number to pad
     * @param  {Number} len Desired length
     * @return {String}     Padded string
     */
    var pad = function(n, len) {
        var n_str = n.toString();
        if (n_str.length >= len) {
            return (n_str);
        }

        return (new Array(len + 1).join('0') + n).slice(-len);
    };

    var Recorder = function(browser, options) {
        var _this = this;

        options = _.extend({
            fps: 15,
            tmpdir: path.join(os.tmpdir(), 'wd-video-recorder-' + Date.now())
        }, options);

        options.tmpdir = path.resolve(options.tmpdir);

        var dir = options.tmpdir;
        var timer = null;
        var running = false;
        var frame = 0;
        var frameInterval = 1000 / options.fps;

        var save = function(screenshot) {
            var name = _this._getFilenameForFrame(pad(frame++, 10));

            fs.writeFileSync(name, screenshot, {
                encoding: 'base64'
            });
        };

        var schedule = function() {
            var t0 = Date.now();

            browser.takeScreenshot(function(error, screenshot) {
                if (error) throw error;

                if (!running) return;

                var t1 = Date.now();
                var dt = t1 - t0;
                var delay = Math.max(0, frameInterval - dt);

                timer = setTimeout(schedule, delay);

                save(screenshot);
            });
        };

        this.start = function() {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            if (!running) {
                running = true;
                schedule();
            }

            return this;
        };

        this.stop = function() {
            if (running) {
                clearTimeout(timer);
                timer = null;
                running = false;
            }

            return this;
        };

        this.clear = function() {
            if (running) {
                throw 'Recorder is running - cannot clear';
            }

            fs.readdirSync(dir).forEach(function(filename) {
                fs.unlinkSync(path.join(dir, filename));
            });

            fs.rmdirSync(dir);

            frame = 0;

            return this;
        };

        this._options = function() {
            return options;
        };

        this.isRecording = function() {
            return running;
        };

        this.numFrames = function() {
            return frame;
        };
    };

    Recorder.prototype.save = function(output, callback) {
        var options = this._options();
        var input = this._getFilenameForFrame('%10d');
        var proc = new ffmpeg({ source: input }).toFormat(options.format || 'avi').addOptions(['-an']);

        if (options.aspect) proc.withAspect(options.aspect);
        if (options.size) proc.withSize(options.size);
        if (options.fps) proc.withFps(options.fps).withFpsInput(options.fps);
        if (options.beforeSave) options.beforeSave.call(this, proc);

        output = path.resolve(process.cwd(), output);

        proc.saveToFile(output, function(stderr, stdout) {
            if (typeof(callback) === 'function') callback.call(this, stderr, stdout, output);
        }.bind(this));

        return this;
    };

    Recorder.prototype.stopSaveAndClear = function(output, callback) {
        this.stop();

        this.save(output, function() {
            this.clear();

            callback.apply(this, arguments);
        }.bind(this));

        return this;
    };

    Recorder.prototype.stopAndSave = function(output, callback) {
        this.stop();
        
        this.save(output, callback);

        return this;
    };

    Recorder.prototype.stopAndClear = function() {
        this.stop();
        this.clear();

        return this;
    };

    Recorder.prototype._getFilenameForFrame = function(frame) {
        return path.resolve(this._options().tmpdir + '/' + frame + '.png');
    };

    module.exports = Recorder;
})();
