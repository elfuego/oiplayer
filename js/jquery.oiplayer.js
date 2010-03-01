/*
 * OIPlayer - jQuery plugin to control and serve alternatives for the html5 video- and audiotag.
 *
 * Copyright (c) 2009 André van Toly
 * Licensed under GPL http://www.gnu.org/licenses/gpl.html
 *
 * Inits and controls video- or audioplayer based on the html5 video- or audiotag. Depends on jquery. 
 * It enables the use of three players in a generic way: html5 media-tag, Java applet Cortado (for ogg) 
 * and Flash FlowPlayer (for mp4 and flv). Sifts through the sources provided by the mediatag to find 
 * a suitable player, replaces the mediatag with it and enables some generic controls.
 * This script borrows heavily from the rather brilliant one used at Steal This Footage which enables
 * a multitude of players (but defies MSIE ;-) http://footage.stealthisfilm.com/
 *
 * MSIE bug (!) : currently I could find no way to makes this plugin behave correctly in MSIE on multiple
 * mediatags in one go. You will have to wrap each mediatag in a div or some other element and feed it
 * to the plugin.
 *
 * @version: 0.4
 * @params:
 *   id - id of the element that contains the media tag
 *   config - configuration parameters
 *       'server' : server url (think only for ie)
 *       'jar' : JAR file of Cortado
 *       'flash' : location of flowplayer.swf
 *       'controls' : to show and use controls or not
 *
 * @changes: jQuery plugin, controls on/of
*/

jQuery.fn.oiplayer = function(conf) {
    return this.each(function() {
        var self = this;
        var config = jQuery.extend({    // example configuration
            server : 'http://www.openimages.eu',
            jar : '/oiplayer/cortado-ovt-stripped-wm_r38710.jar',
            flash : '/oiplayer/flowplayer-3.1.1.swf',
            controls : true
        }, conf);
            
        var mediatags = $(this).find('video, audio');
        $.each(mediatags, function(i, mt) {
            var sources = $(mt).find('source');
            if (sources.length == 0) {
                //alert("no sources found in mediatag, will use first available");
                /* at least this works in MSIE (and other browsers that don't know html5 video or audio ?) */
                sources = $(self).find('source');
            }
            
            $(mt).wrap('<div class="oiplayer"></div>');
            var div = $(mt).parent('div.oiplayer');
            var player = createPlayer(mt, sources, config);
            //console.log("info: " + player.info);
            
            var poster = createPoster(self, player); // using self (complete input) for MSIE
            if ($.browser.msie || player.myname == 'flowplayer') { 
                $('p.oiplayer-warn').hide(); // MSIE places stuff partly outside mediatag
                $(div).find('div.oiplayer-flash').hide(); // .remove() would indefinitely loop MSIE
            } else {
                $(div).empty();
            }
            $(div).prepend(poster);

            /* click preview: play */
            $(div).find('img.oipreview').click(function(ev) {
                ev.preventDefault();
                if (player.type == 'video') {
                    $(div).find('img.oipreview').remove();
                } else {
                    $(div).find('img.oipreview').css("z-index", "1");
                }
                $(div).find('div.oiplayer-flash').show();
                $(div).append(player.player);
                $(player.player).css("z-index", "9");
                player.play();
                if (config.controls == true) {
                    $.oiplayer.follow(player, timer);
                    if ($(ctrls).find('li.pause').length == 0) {
                        $(ctrls).find('li.play').addClass('pause');
                    }
                }
            });     
            
            if (config.controls == true) {
                $(div).after(createControls());
            
                /* click play/pause button */
                var ctrls = $(div).next('ul.controls');
                var timer = $(ctrls).find('li.position');
                $(ctrls).find('li.play').click(function(ev) {
                    ev.preventDefault();
                    if (player.state == 'pause') {
                        player.play();
                        if ($(ctrls).find('li.pause').length == 0) {
                            $(ctrls).find('li.play').addClass('pause');
                        }
                        $.oiplayer.follow(player, timer);
                    } else if (player.state == 'play') {
                        player.pause();
                        $(ctrls).find('li.play').removeClass('pause');
                    } else {
                        if (player.type == 'video') {
                            $(div).find('img.oipreview').remove();
                        }
                        $(div).append(player.player);
                        player.play();
                        if ($(ctrls).find('li.pause').length == 0) {
                            $(ctrls).find('li.play').addClass('pause');
                        }
                        $.oiplayer.follow(player, timer);
                    }
                    //console.log("player state: " + player.state);
                });
            }

        });

        return this; // plugin convention
    });
    
    /* 
     * Create player
     * @param el        video or audio element
     * @param config    configuration
     * @return Player
     */
    function createPlayer(el, sources, config) {
        var player;
        var types = $.map(sources, function(i) {
            return $(i).attr('type');
        });
        var urls = $.map(sources, function(i) {
            return $(i).attr('src');
        });
        if (urls.length == 0) { // no sources in body
            urls[0] = $(el).attr('src');
            types[0] = "unknown";   // TODO ? 
        }
        
        var selectedPlayer = selectPlayer(el, types, urls);
        if (selectedPlayer.type == 'media') {
            player = new MediaPlayer();
        } else if (selectedPlayer.type == 'cortado') {
            player = new CortadoPlayer();
        } else if (selectedPlayer.type == 'msie_cortado') {
            player = new MSCortadoPlayer();
        } else if (selectedPlayer.type == 'flash') {
            player = new FlowPlayer();
        } else {
            player = new Player();
        }
        player.type = el.tagName.toLowerCase();
        player.player = el;
        player.url = selectedPlayer.url;
        player.info = selectedPlayer.type + ":" + selectedPlayer.url;
        player.init(el, selectedPlayer.url, config);
        return player;
    }
    
    /* 
     * Selects which player to use and returns a proposal.type and proposal.url. 
     * Adapt this to change the prefered order, here the order is: video, cortado, msie_cortado flash.
     * @param el    video or audio element
     * @param types mimetypes
     * @param urls  media links
     */
    function selectPlayer(el, types, urls) {
        //alert("types: " + types);
        var proposal = new Object();
        var probably = canPlayMedia(types, urls);
        if (probably != undefined) {
            proposal.type = "media";
            proposal.url = probably;
            return proposal;    // optimization
        }
        if (proposal.type == undefined) {
            probably = canPlayCortado(types, urls);
            if (probably != undefined && (supportMimetype('application/x-java-applet') || navigator.javaEnabled())) {
                if ($.browser.msie) {   // Argh! A browser check!
                    /* IE always reports true on navigator.javaEnabled(),
                       that's why we need to check for the java plugin IE style. 
                       It needs an element with id 'clientcaps' somewhere in the page. 
                    */
                    var javaVersionIE = clientcaps.getComponentVersion("{08B0E5C0-4FCB-11CF-AAA5-00401C608500}", "ComponentID");
                    if (javaVersionIE) {
                        proposal.type = "msie_cortado";
                        proposal.url = probably;
                    }
                    if (el.tagName.toLowerCase() == 'audio') {      // always use cortado on msie
                        proposal.type = "msie_cortado";
                        proposal.url = probably;
                    }
                } else {
                    proposal.type = "cortado";
                    proposal.url = probably;
                }
            }
        }
        if (proposal.type == undefined) {
            var flash_url;
            for (var i = 0; i < types.length; i++) {
                if (types[i].indexOf("video/mp4") > -1 || types[i].indexOf("video/flv") > -1
                    /* || types[i].indexOf("video/mpeg") > -1 */ ) {
                    proposal.url = urls[i];
                    proposal.type = "flash";
                }
            }
        }
        return proposal;
    }
    
    /*
     * Examines mimetypes and returns belonging ogg url it expects to be able to play.
     */
    function canPlayCortado(types, urls) {
        var url;
        for (var i = 0; i < types.length; i++) {
            if (types[i].indexOf("video/ogg") > -1 ||
                types[i].indexOf("audio/ogg") > -1 ||
                types[i].indexOf("application/ogg") > -1 ||
                types[i].indexOf("application/x-ogg") > -1) {
                url = urls[i];
                break;
            }
        }
        return url;
    }
    
    /*
     * Returns url it expects to be able to play with html5 video- or audiotag based on mimetype.
     */
    function canPlayMedia(types, urls) {
        var vEl = document.createElement("video");
        var aEl = document.createElement("audio");
        if (vEl.canPlayType || aEl.canPlayType) {
            for (var i = 0; i < types.length; i++) {
                /*
                 http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#dom-navigator-canplaytype
                 Firefox 3.5 is very strict about this and does not return 'probably', but does on 'maybe'.
                */
                if (vEl.canPlayType( types[i] ) == "probably" || aEl.canPlayType( types[i] ) == "probably") {
                    return urls[i]; // this is the best we can do
                }
                if (vEl.canPlayType( types[i] ) == "maybe" || aEl.canPlayType( types[i] ) == "maybe") {
                    return urls[i]; // if we find nothing better
                }
            }
        }
    }

    function findTag(el) {
        var o = new Object();
        o.type = "video";
        o.element = $(el).find('video')[0];
        if (o.element == undefined) {
            o.type = "audio";
            o.element = $(el).find('audio')[0];
        }
        return o;
    }
    
    function supportMimetype(mt) {
        var support = false;    /* navigator.mimeTypes is unsupported by MSIE ! */
        if (navigator.mimeTypes && navigator.mimeTypes.length > 0) {
            for (var i = 0; i < navigator.mimeTypes.length; i++) {
                if (navigator.mimeTypes[i].type.indexOf(mt) > -1) {
                    support = true;
                }
            }
        }
        return support;
    }

    function createPoster(el, player) {
        var src = player.poster;
        if (src == undefined) { // for audio-tags (no attribute poster)
            var img = $(el).find('img')[0];
            src = $(img).attr('src');
            $(img).remove();
        }
        return '<img src="' + src + '" alt="" class="oipreview" width="' + player.width + '" height="' + player.height + '" />';
    }
        
    function createControls() {
        var html = '<ul class="controls">' + 
                      '<li class="play"><a href="#play">play</a></li>' +
                      '<li class="position">00:00</li>' +
                   '</ul>';
        return html;
    }
    
    function showInfo() {
        var text = player.info;
        var id = player.id;
        if ($('#' + id).find('div.playerinfo').length > 0) $('#' + id).find('div.playerinfo').remove();
        $('#' + id).append('<div class="playerinfo">' + text + '</div>');
    }

};

//  ------------------------------------------------------------------------------------------------
//  Global functions
//  ------------------------------------------------------------------------------------------------

$.oiplayer = {
    
    /* 
     * Updates the provided html element with progress time of player
     * @param player Object of player
     * @param el     HTML element
     */
    follow: function (player, el) {
        var pos = player.duration;
        var progress = null;
        clearInterval(progress);
        progress = setInterval(function() {
                pos = player.position();
                if (!isNaN(pos) && pos > 0) {
                    $(el).text(toTime(pos));
                }
                if (pos == undefined) {
                    clearInterval(progress);
                    return;
                }
            }, 200);

        function toTime(sec) {
            var h = Math.floor(sec / 3600);
            var min = Math.floor(sec / 60);
            var sec = Math.floor(sec - (min * 60));
            if (h >= 1) {
                min -= h * 60;
                return addZero(h) + ":" + addZero(min) + ":" + addZero(sec);
            }
            return addZero(min) + ":" + addZero(sec);
        }
        
        function addZero(time) {
            time = parseInt(time, 10);
            return time < 10 ? "0" + time : time;
        }

    }
}

//  ------------------------------------------------------------------------------------------------
//  Prototypes of several players
//  ------------------------------------------------------------------------------------------------

function Player() {
    this.myname = "super";
}
Player.prototype.init = function(el, url, config) { }
Player.prototype.play = function() { }
Player.prototype.pause = function() { }
Player.prototype.position = function() { }
Player.prototype.info = function() { }

Player.prototype._init = function(el, url, config) {
    this.url = url;
    this.poster = $(this.player).attr('poster');
    //console.log("this.poster: " + this.poster);
    this.autoplay = $(this.player).attr('autoplay');
    if (this.autoplay == undefined) this.autoplay = false;
    this.autobuffer = $(this.player).attr('autobuffer');
    if (this.autobuffer == undefined) this.autobuffer = false;
    this.controls = $(this.player).attr('controls');
    if (this.controls == undefined) this.controls = false;
    this.width  = $(this.player).attr('width');
    this.height = $(this.player).attr('height');
    if (this.width  == undefined) this.width  = $("head meta[name=media-width]").attr("content");
    if (this.height == undefined) this.height = $("head meta[name=media-height]").attr("content");
    this.duration = $("head meta[name=media-duration]").attr("content"); // not a mediatag attr.
    this.state = 'init';
    this.pos = 0;
    
    return this.player;
}

function MediaPlayer() {
    this.myname = "mediaplayer";
}
MediaPlayer.prototype = new Player();
MediaPlayer.prototype.init = function(el, url, config) {
    this._init(el, url, config); // just init and pass it along
    this.url = url;
    var self = this;
    //console.log(this.player);
    var timer = $(el).find('ul.controls li.position');
    this.player.addEventListener("playing", 
                                  function(ev) {
                                      self.state = 'play';
                                      $.oiplayer.follow(self, timer);
                                  },
                                  false);
    return this.player;
}
MediaPlayer.prototype.play = function() {
    this.player.play();
    this.state = 'play';
}
MediaPlayer.prototype.pause = function() {
    this.player.pause();
    this.state = 'pause';
}
MediaPlayer.prototype.position = function() {
    try {
        this.pos = this.player.currentTime;
        return this.pos;
    } catch(err) {
        //console.log("Error: " + err);
    }
    return -1;
}
MediaPlayer.prototype.info = function() {
    /*  duration able in webkit, 
        unable in mozilla without: https://developer.mozilla.org/en/Configuring_servers_for_Ogg_media
    */
    //return "Duration: " + this.player.duration + " readyState: " + this.player.readyState;
}

function CortadoPlayer() {
    this.myname = "cortadoplayer";
}
CortadoPlayer.prototype = new Player();
CortadoPlayer.prototype.init = function(el, url, config) {
    this._init(el, url, config);
    this.url = url;
    var jar = config.jar;
    var usevideo = true;
    var useheight = this.height;
    if (this.type == 'audio') {
        usevideo = false;
        useheight = 12;
    }
    
    this.player = document.createElement('object'); // create new element!
    $(this.player).attr('classid', 'java:com.fluendo.player.Cortado.class');
    $(this.player).attr('style', 'display:block;width:' + this.width + 'px;height:' + useheight + 'px;');
    $(this.player).attr('type', 'application/x-java-applet');
    $(this.player).attr('archive', jar);
    if (this.width)  $(this.player).attr('width', this.width);
    if (this.height) $(this.player).attr('height', this.height);
    var params = {
        'code' : 'com.fluendo.player.Cortado.class',
        'archive' : jar,
        'url': url,
         // 'local': 'false',
        'duration': Math.round(this.duration),
        'keepAspect': 'true',
        'showStatus' : this.controls,
        'video': usevideo,
        'audio': 'true',
        'seekable': 'auto',
        'autoPlay': this.autoplay,
        'bufferSize': '256',
        'bufferHigh': '50',
        'bufferLow': '5'
    }
    for (name in params) {
        var p = document.createElement('param');
        p.name = name;
        p.value = params[name];
        this.player.appendChild(p);
    }
    return this.player;
}

CortadoPlayer.prototype.play = function() {
    if (this.state == 'pause') {
        // impossible when duration is unknown (and not really smooth in cortado)
        // console.log("pos: " + this.pos + " pos as double: " + this.duration / this.pos);
        // this.player.doSeek(this.duration / this.pos);
        this.player.doPlay();
    } else {
        this.player.doPlay();
    }
    this.state = 'play';
}
CortadoPlayer.prototype.pause = function() {
    this.pos = this.player.getPlayPosition();
    this.player.doPause();
    this.state = 'pause';
//     try {
//         this.player.doStop();
//     } catch(err) { }
}
CortadoPlayer.prototype.position = function() {
    this.pos = this.player.getPlayPosition();
    return this.pos;
}
CortadoPlayer.prototype.info = function() {
    //return "Playing: " + this.url";
}

function MSCortadoPlayer() {
    this.myname = "msie_cortadoplayer";
}
MSCortadoPlayer.prototype = new CortadoPlayer();
MSCortadoPlayer.prototype.init = function(el, url, config) {
    this._init(el, url, config);
    /* msie (or windows java) can only load an applet from the root of a site, not a directory or context */
    var jar = config.server + config.jar; 
    var usevideo = true;
    var useheight = this.height;
    if (this.type == 'audio') { 
        usevideo = false;
        useheight = 12;
    }
    var element = document.createElement('div');
    var obj_html = '' +
    '<object classid="clsid:8AD9C840-044E-11D1-B3E9-00805F499D93" '+
    '  codebase="http://java.sun.com/update/1.5.0/jinstall-1_5_0-windows-i586.cab" '+
    //'  id="msie_cortadoplayer_' + id + '" '+
    '  id="msie_cortadoplayer_oiplayer"' +
    '  allowscriptaccess="always" width="' + this.width + '" height="' + useheight + '">'+
    ' <param name="code" value="com.fluendo.player.Cortado" />'+
    ' <param name="archive" value="' + jar + '" />'+
    ' <param name="url" value="' + this.url + '" /> '+
    ' <param name="duration" value="' + Math.round(this.duration) + '" /> '+
    ' <param name="local" value="true" /> ' +
    ' <param name="keepAspect" value="true" /> ' +
    ' <param name="video" value="' + usevideo + '" /> ' +
    ' <param name="audio" value="true" /> ' +
    ' <param name="seekable" value="auto" /> '+
    ' <param name="showStatus" value="' + this.controls + '" /> '+
    ' <param name="bufferSize" value="256" /> '+
    ' <param name="bufferHigh" value="50" /> '+
    ' <param name="bufferLow" value="5" /> '+
    ' <param name="autoPlay" value="' + this.autoplay + '" /> '+
    ' <strong>Your browser does not have a Java Plug-in. <a href="http://java.com/download">Get the latest Java Plug-in here</a>.</strong>' +
    '</object>';
    $(element).html(obj_html);
    this.player = element.firstChild;
    return this.player;
}

function FlowPlayer() {
    this.myname = "flowplayer";
}
FlowPlayer.prototype = new Player();
FlowPlayer.prototype.init = function(el, url, config) {
    this._init(el, url, config);
    var flwplayer = config.flash;
    var duration = (this.duration == undefined ? 0 : Math.round(this.duration));
    
    var div = document.createElement('div'); // TODO: add (random) id: adding flowplayer and returning it impossible without id
    $(el).parent('div.oiplayer').html(div);
    $(div).addClass('oiplayer-flash');
    this.player = $f(div, { src : flwplayer, width : this.width, height : this.height }, {
        clip: {
            url: this.url,
            autoPlay: this.autoplay,
            duration: duration,
            scaling: 'fit',
            autoBuffering: this.autobuffer,
            bufferLength: 5
        },
        plugins: { controls: { height: 24, autoHide: 'always', hideDelay: 2000, fullscreen: false } }
    });
    return this.player;
}
FlowPlayer.prototype.play = function() {
    if (this.player.getState() == 4) {
        this.player.resume();
    } else if (this.player.getState() != 3) {
        this.player.play();
    }
    this.state = 'play';
}
FlowPlayer.prototype.pause = function() {
    if (this.player.getState() == 3) this.player.pause();
    this.state = 'pause';
}
FlowPlayer.prototype.position = function() {
    this.pos = this.player.getTime();
    return this.pos;
}
FlowPlayer.prototype.info = function() {
    //return "Playing: " + this.url;
}


