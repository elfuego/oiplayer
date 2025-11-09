README
=======
========

OIPlayer is to create a HTML5 audio and video player with fallback to Java and Flash. It is originally being developed for the media platform [Open Images](http://www.openimages.eu)

OIPlayer can 'attach' itself to every video or audio tag it encounters. Besides the general configuration of the plugin itself, it uses for each individual tag the attributes the respective tag has like poster, width, controls, autoplay etc. It is quite easy to implement, when all libraries are included.
  
Most simple way to activate OIPlayer on all video or audio tags in your page:

You can use OIPlayer on more specific for certain sections of your web page and even serving older browsers that do not support the tag video or audio. The following configuration example can be found here [http://www.openimages.eu/oiplayer](http://www.openimages.eu/oiplayer)

You will need to include these files: jQuery library, Flowplayer jQuery plugin, OIPlayer jQuery plugin and its css stylesheet.

    <script src="oiplayer/plugins/flowplayer-3.1.4.min.js" type="text/javascript"></script>
    <script src="oiplayer/js/jquery.oiplayer.js" type="text/javascript"></script>
    <link href="oiplayer/css/oiplayer.css" rel="stylesheet" type="text/css" />

For example the following video tag including sources of a webm, ogv and h.264 file.

    <div class="post">
      <video width="512" height="288">
        <source type="video/ogg; codecs=theora" src="http://www.openimages.eu/files/09/9734.9730.WEEKNUMMER364-HRE0000D9C6.ogv"  />
        <source type="video/webm; codecs=vp8" src="http://www.openbeelden.nl/files/09/88068.9730.WEEKNUMMER364-HRE0000D9C6.webm" />
        <source type="video/mp4; codecs=h264" src="http://www.openimages.eu/files/09/9740.9730.WEEKNUMMER364-HRE0000D9C6.mp4" />
      </video>
    </div>

## Methods ##

You need to target media on which OIPlayer is enabled individually - with an id for example - like in this case with id #video.

    <video id="video">
      <source type="video/webm; codecs=vp8,vorbis" src="lovefields.webm" />
    </video>

You can jump to 60 seconds in the video with id #video. The first argument is method, second is the id of the media element you're targetting and third some parameter like number of seconds or volume.

Just **start** video at 60 seconds.

And **jump** to 60 seconds, don't start.

Set audio **volume** of #video to half. This works on a scale from 0 to 100.

Put it back at full volume.

Get current **position** of media in seconds.

## Development ##

This project can be build with WebPack. Run NPM to install all needed developer dependencies listed in `package.json`. Start developing `npm start`.

```bash
$ npm install
```

Or use `yarn` if you prefer. To start developing and run a simultaneous watch task, run the default task:

```bash
$ npm start
```

It will start a watch task.


### History ###

26-10-2025
Upgraded to WebPack, WIP vanilla Javascript.

13-11-2016
Updated methods start, jump and volume. Added method position to be able track player position (time in seconds). Added new gulp tasks for minification, browsersync, jslint and reformatted code. Tested on current lastest jQuery.

28-04-2015
I merged the event-driven branch in develop. It contains several methods to control oiplayer from 'the outside', make it 'jump' to spots several seconds in a video or audio etc. 

13-07-2011
I moved OIPlayer from the Open Images project in MMBase svn to this <https://github.com/elfuego/oiplayer> location in github to make it a bit easier to experiment with its code. 
