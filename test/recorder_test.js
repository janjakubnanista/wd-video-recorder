'use strict';

require('colors');
require('chai').should();

var fs = require('fs');
var os = require('os');
var path =require('path');
var expect = require('expect.js');
var sinon = require('sinon');

describe('Recorder', function() {
    var Recorder = require('../lib/recorder');
    var png = fs.readFileSync(__dirname + '/test.png');

    beforeEach(function() {
        this.error = false;
        this.browser = {
            takeScreenshot: function(callback) {
                setTimeout(function() {
                    callback(this.error ? 'error' : null, png);
                }.bind(this), this.timeout);
            }.bind(this)
        };
        this.output = __dirname + '/output.avi';
        this.dir = __dirname + '/screenshots';
        this.options = {
            fps: 15,
            tmpdir: this.dir,
            beforeSave: sinon.spy()
        };
        this.frameInterval = 1000 / this.options.fps;
        this.timeout = this.frameInterval;
        this.recorder = new Recorder(this.browser, this.options);
        this.clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        this.recorder.stop();

        if (fs.existsSync(this.dir)) {
            fs.readdirSync(this.dir).forEach(function(filename) {
                fs.unlinkSync(path.join(this.dir, filename));
            }.bind(this));

            fs.rmdirSync(this.dir);
        }

        if (fs.existsSync(this.output)) {
            fs.unlinkSync(this.output);
        }

        this.clock.restore();
    });

    it('should use system\'s tmpdir to store screenshots if not specified otherwise', function() {
        var recorder = new Recorder(this.browser);
        var tmpdir = os.tmpdir();

        expect(recorder._options().tmpdir).to.contain(tmpdir);
    });

    describe('start method', function() {
        it('should capture a frame according to specified FPS', function() {
            sinon.spy(this.browser, 'takeScreenshot');

            this.timeout = this.frameInterval / 2;

            this.recorder.start();
            expect(this.browser.takeScreenshot.callCount).to.be(1);

            this.timeout = this.frameInterval * 2;
            this.clock.tick(this.frameInterval);
            expect(this.browser.takeScreenshot.callCount).to.be(2);

            this.clock.tick(this.frameInterval);
            expect(this.browser.takeScreenshot.callCount).to.be(2);

            this.clock.tick(this.frameInterval);
            expect(this.browser.takeScreenshot.callCount).to.be(3);
        });

        it('should make isRecording method return true', function() {
            expect(this.recorder.isRecording()).to.be(false);

            this.recorder.start();

            expect(this.recorder.isRecording()).to.be(true);
        });
    });

    describe('stop method', function() {
        it('should cancel frame capturing', function() {
            sinon.spy(this.browser, 'takeScreenshot');

            this.recorder.start();
            expect(this.browser.takeScreenshot.callCount).to.be(1);

            this.recorder.stop();
            this.clock.tick(this.frameInterval * 2);
            expect(this.browser.takeScreenshot.callCount).to.be(1);
        });

        it('should make isRecording method return false', function() {
            this.recorder.start();

            expect(this.recorder.isRecording()).to.be(true);

            this.recorder.stop();

            expect(this.recorder.isRecording()).to.be(false);
        });
    });

    describe('save method', function() {
        it('should save all frames from tmpdir to a avi video file', function(done) {
            this.recorder.start();

            this.clock.tick(this.frameInterval * 5);

            expect(fs.existsSync(this.dir)).to.be(true);

            this.recorder.stop();

            this.recorder.save(this.output, function(stderr, stdout, output) {
                expect(fs.statSync(output).isFile(output)).to.be(true);

                done();
            });
        });


        it('should save in custom format provided in options.format', function(done) {
            this.output =  __dirname + '/output.mp4';
            this.options.format = 'mp4';

            this.recorder.start();

            this.clock.tick(this.frameInterval * 5);

            expect(fs.existsSync(this.dir)).to.be(true);

            this.recorder.stop();

            this.recorder.save(this.output, function(stderr, stdout, output) {
                expect(fs.statSync(output).isFile(output)).to.be(true);

                done();
            });
        });

        it('should call options.beforeSave callback with ffmpeg as parameter', function(done) {
            this.recorder.start();

            this.clock.tick(this.frameInterval);

            this.recorder.stop();
            this.recorder.save(this.output, function() {
                expect(this.options.beforeSave.calledOnce).to.be(true);

                done();
            }.bind(this));
        });

        it('should not erase tmpdir', function(done) {
            this.recorder.start();

            this.clock.tick(this.frameInterval);

            this.recorder.stop();
            this.recorder.save(this.output, function() {
                expect(fs.existsSync(this.dir)).to.be(true);

                done();
            }.bind(this));
        });
    });

    describe('clear method', function() {
        it('should erase tmpdir', function() {
            this.recorder.start();

            this.clock.tick(this.frameInterval * 2);

            this.recorder.stop();

            expect(fs.existsSync(this.dir)).to.be(true);

            this.recorder.clear();

            expect(fs.existsSync(this.dir)).to.be(false);
        });
    });

    describe('stopAndSave method', function() {
        it('should call stop, save and clear methods', function(done) {
            sinon.spy(this.recorder, 'stop');
            sinon.spy(this.recorder, 'save');
            sinon.spy(this.recorder, 'clear');

            this.recorder.start();

            this.clock.tick(this.frameInterval);

            this.recorder.stopAndSave(this.output, function() {
                expect(this.recorder.stop.calledOnce).to.be(true);
                expect(this.recorder.save.calledOnce).to.be(true);
                expect(this.recorder.clear.called).to.be(false);
                expect(this.recorder.stop.calledBefore(this.recorder.save)).to.be(true);

                done();
            }.bind(this));
        });
    });

    describe('stopSaveAndClear method', function() {
        it('should call stop, save and clear methods', function(done) {
            sinon.spy(this.recorder, 'stop');
            sinon.spy(this.recorder, 'save');
            sinon.spy(this.recorder, 'clear');

            this.recorder.start();

            this.clock.tick(this.frameInterval);

            this.recorder.stopSaveAndClear(this.output, function() {
                expect(this.recorder.stop.calledOnce).to.be(true);
                expect(this.recorder.save.calledOnce).to.be(true);
                expect(this.recorder.clear.calledOnce).to.be(true);
                expect(this.recorder.stop.calledBefore(this.recorder.save)).to.be(true);
                expect(this.recorder.save.calledBefore(this.recorder.clear)).to.be(true);

                done();
            }.bind(this));
        });
    });

    describe('stopAndClear method', function() {
        it('should call stop and clear methods', function() {
            sinon.spy(this.recorder, 'stop');
            sinon.spy(this.recorder, 'save');
            sinon.spy(this.recorder, 'clear');

            this.recorder.start();
            this.recorder.stopAndClear();

            expect(this.recorder.save.called).to.be(false);
            expect(this.recorder.stop.calledOnce).to.be(true);
            expect(this.recorder.clear.calledOnce).to.be(true);
            expect(this.recorder.stop.calledBefore(this.recorder.clear)).to.be(true);
        });
    });
});
