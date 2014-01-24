WD Video Recorder
=================

Utility that allows you to make videos of your integration tests with WD.
See [WD homepage](https://github.com/admc/wd) for more information on how to run integration tests with node.

WD Video Recorder uses [fluent-ffmpeg](https://github.com/schaermu/node-fluent-ffmpeg) interface for FFMpeg. **FFMpeg must be installed on your system prior to using this utility!**

## Installation

Utility is distributed via npm. Execute
	
	$ npm install wd-video

from root directory of your node project to install WD Video Recorder.

## Usage

Using WD Video Recorder should be really easy. The process consists of 6 simple steps:

1. Import library to your JavaScript (test) file
	
		var Recorder = require('wd-video-recorder');
		
2. Initialize WD environment. For more information how to do this, please visit [WD homepage](https://github.com/admc/wd).

		var browser = wd.promiseChainRemote();
		browser.init({browserName:'firefox'}).then(function() {
			// ...
		});


2. Create an instance of video recorder class

		var recorder = new Recorder(browser, [options]);
		
	You can limited set of configuration options to constructor. See [Recorder.constructor](#recorder.constructor) for more information.

3. Start recording

		recorder.start();
		
4. Stop recording

		recorder.stop();
		
5. Save recorded video

		recorder.save(output, callback);
		
	`callback` function receives three parameters - stderr, stdout and full path to recorded video.
	
6. Clear recorder

		recorder.clear();
		
	Since recorder uses WD screenshot feature, it peridocally takes screenshots of browser window. These screenshots are stored on your filesystem (either your system's temporary directory or in `tempDir` directory specified in constructor options. See [Recorder.constructor](#recorder.constructor) for more information.). These screenshots should be deleted after recording video.
	
## Recorder API

### <a name="recorder.constructor"></a>constructor

`new Recorder(browser:WD.browser, [options:Object]):Recorder`

**Parameters**

`browser` *WD Browser* Instance of WD browser.

`options` *Object* Optional. Hash of configuration options for this recorder. Following options are recognized:

- `tmpdir` *String* Path to a directory. Recorder will create a subdirectory for its screenshots in this directory. Defaults to `os.tmpdir()`.
- `fps` *Integer* Frames per second. Screenshots will be taken at most at this rate. Actual rate depends on the browser delay (taking a screenshot is asynchronous). default FPS is 15.
- `aspect` *String* Aspect ratio of recorded video. `4:3` for example. It is unspecified by default.
- `size` *String* Size of recorded video. `800x600` for example. It is unspecified by default.
- `beforeSave` *Function(proc:ffmpeg):void* Callback invoked just before saving the video. It takes on paramater - underlying FFMpeg process instance (See [fluent-ffmpeg](https://github.com/schaermu/node-fluent-ffmpeg) for documentation). This allows you to further modify the video output.


### start

`recorder.start():Recorder`

Starts taking screenshots from `browser` instance passed to [constructor](#recorder.constructor).

**Returns** This instance.

### <a name="recorder.save"></a>save

`recorder.save(output:String, callback:Function(stderr:String, stdout:String, output:String)):Recorder`

**Parameters**

`output` *String* Relative (to current working directory) or absolute path to desired output video file.

`callback` *Function(stderr:String, stdout:String, output:String)* Callback function that gets called after save is done.

**Returns** This instance

### clear

`recorder.clear():Recorder`

Removes all taken screenshots and screenshots directory itself. Throws an exception and does nothing if the recorder is running.

**Returns** This instance

### stop

`recorder.stop():Recorder`

Stops the recorder from taking screenshots. Does not remove screenshots or screenshots directory. After calling `stop()`, you may call `start()` again to resume recording.

**Returns** This instance

### stopAndClear

`recorder.stopAndClear():Recorder`

Stops recorder and clears the screenshots directory.

**Returns** This instance

### stopAndSave

`recorder.stopAndSave(output:String, callback:Function(stderr:String, stdout:String, output:String)):Recorder`

Stops recorder and saves the video. See [save](#recorder.save) method for parameter reference.

**Parameters**

Same as for [save](#recorder.save) method

**Returns** This instance

### stopSaveAndClear

`recorder.stopSaveAndClear(output:String, callback:Function(stderr:String, stdout:String, output:String)):Recorder`

Stops recorder, saves the video and clears the screenshots directory. See [save](#recorder.save) method for parameter reference.

**Parameters**

Same as for [save](#recorder.save) method

**Returns** This instance

## Testing

Unit tests can be run from command line with:

	$ grunt test











