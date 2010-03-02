/*
  Javascript to init and configure OIPlayer.
  
  @author: André van Toly
  @version: '$Id$'
  @changes: moved all oiplayer stuff to one directory
*/

$(document).ready(function() {
    $('body.oiplayer-example').oiplayer({
        server : 'http://www.openimages.eu', /* msie (or windows java) has issues with just a dir */
        jar : '/player/cortado-ovt-stripped-wm_r38710.jar',
        flash : '/player/flowplayer-3.1.1.swf',
        controls : true
    });
});
