/*
  Javascript to init and configure OIPlayer.
  
  @author: André van Toly
  @version: '$Id: andre $'
  @changes: moved all oiplayer stuff to one directory
*/

$(document).ready(function() {
    $('.main').oiplayer({
        'server' : 'http://192.168.1.4:8080/', /* msie (or windows java) has issues with just a dir */
        'jar' : 'plugins/cortado-ovt-stripped-wm_r38710.jar',
        'flash' : 'plugins/flowplayer-3.1.1.swf',
        'controls' : true
    });
});
