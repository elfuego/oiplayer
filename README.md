README
=======

OIPlayer is to create a HTML5 audio and video player. It is originally being developed for the media platform [Open Images](http://www.openimages.eu)

OIPlayer can 'use' every video or audio tag it encounters. Besides the general configuration of the plugin itself, it uses for each individual tag the attributes the respective tag has like poster, width and height. It is quite easy to implement, no libraries to include.
  
OIPlayer was originally developed to help older browsers with the HTML5 media tag, it provided a fallback to a Java and Flash player.

Most simple way to activate OIPlayer on all video or audio tags in your page: include these files oiplayer js and its css stylesheet.

    <script src="oiplayer/js/oiplayer.min.js" type="text/javascript"></script>
    <link href="oiplayer/css/oiplayer.css" rel="stylesheet" type="text/css" />

For example the following video tag including sources of a webm, ogv and h.264 file.

    <video width="512" height="288">
      <source type="video/ogg; codecs=theora" src="http://www.openimages.eu/files/09/9734.9730.WEEKNUMMER364-HRE0000D9C6.ogv"  />
      <source type="video/webm; codecs=vp8" src="http://www.openbeelden.nl/files/09/88068.9730.WEEKNUMMER364-HRE0000D9C6.webm" />
      <source type="video/mp4; codecs=h264" src="http://www.openimages.eu/files/09/9740.9730.WEEKNUMMER364-HRE0000D9C6.mp4" />
    </video>

## Methods ##

@TODO: re-enable

## Development ##

This project can be build with WebPack. Run NPM to install all needed developer dependencies listed in `package.json`. Start developing `npm start`.

```bash
npm install
```

Or use `yarn` if you prefer. To start developing and run a simultaneous watch task, run the default task:

```bash
npm start
```

To build a distributable version:

```bash
npm run dist
```

### History ###

26-10-2025
Upgraded to WebPack, started on vanilla Javascript.

13-11-2016
Updated methods start, jump and volume. Added method position to be able track player position (time in seconds). Added new gulp tasks for minification, browsersync, jslint and reformatted code. Tested on current lastest jQuery.

28-04-2015
I merged the event-driven branch in develop. It contains several methods to control oiplayer from 'the outside', make it 'jump' to spots several seconds in a video or audio etc.

13-07-2011
I moved OIPlayer from the Open Images project in MMBase svn to this <https://github.com/elfuego/oiplayer> location in github to make it a bit easier to experiment with its code.
