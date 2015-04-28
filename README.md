README
============

OIPlayer is a jQuery plugin to create a HTML5 audio and video player with fallback to Java and Flash. It is originally being developed for the media platform [Open Images](http://www.openimages.eu)

OIPlayer can 'attach' itself to every video or audio tag it encounters. Besides the general configuration of the plugin itself, it uses for each individual tag the attributes the respective tag has like poster, width, controls, autoplay etc. It is quite easy to implement, when all libraries are included.
  
Most simple way to activate OIPlayer on all video or audio tags in your page:

    $(document).ready(function() {
        $('body').oiplayer();   // on all video and audio tags in body
    });

You can use OIPlayer on more specific for certain sections of your web page and even serving older browsers that do not support the tag video or audio. The following configuration example can be found here [http://www.openimages.eu/oiplayer](http://www.openimages.eu/oiplayer)

You will need to include these files: jQuery library, Flowplayer jQuery plugin, OIPlayer jQuery plugin and its css stylesheet.

    <script src="oiplayer/js/jquery-1.5.1.min.js" type="text/javascript"></script>
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

Activate OIPlayer on all div's with class 'post'.

    $(document).ready(function() {
        $('div.post').oiplayer(
            server : 'http://www.openimages.eu',
            jar : '/oiplayer/plugins/cortado-ovt-stripped-wm_r38710.jar',
            flash : '/oiplayer/plugins/flowplayer-3.1.5.swf',
            controls : 'top'
        );   
    });

The above configuration covers something like 99% of all current browsers. Maybe even the ones that existed before Flash started playing video, since it can fallback to Java with the Cortado applet that plays ogg media files. You will need to change the server name property to your own server, often browsers or their plugins dislike loading files from different servers. 



History

13-07-2011
I moved OIPlayer from the Open Images project in MMBase svn to this <https://github.com/elfuego/oiplayer> location in github to make it a bit easier to experiment with its code. 
