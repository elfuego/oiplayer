/*
 * OIPlayer - jQuery plugin to control and serve alternatives for the html5 video- and audiotag.
 *
 * Copyright (c) 2009-2010 André van Toly
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
 * @params:
 *   id - id of the element that contains the media tag
 *   config - configuration parameters
 *       'server' : server url (think only for ie)
 *       'jar' : JAR file of Cortado
 *       'flash' : location of flowplayer.swf
 *       'controls' : to show and use controls or not (make sure to include jquery-ui-1.7.2.slider.js when true)
 *
 * @changes: added seek, fullscreen and mute
 * @version: '$Id$'
*/

jQuery.fn.oiplayer = function(conf) {
    return this.each(function() {
        var self = this;
        var config = jQuery.extend({    // example configuration
            server : 'http://www.openimages.eu',
            jar : '/player/cortado-ovt-stripped-wm_r38710.jar',
            flash : '/player/plugins/flowplayer-3.1.1.swf',
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
            
            $(mt).wrap('<div class="oiplayer"><div class="player"></div></div>');
            var div = $(mt).closest('div.oiplayer');
            var player = createPlayer(mt, sources, config);
            //console.log("info: " + player.info);
            var poster = createPoster(self, player);
            $(div).find('div.player').hide();
            $(div).prepend(poster);
            
            if ($.browser.msie) { 
                //$('p.oiplayer-warn').hide(); // MSIE places stuff partly outside mediatag
            }

            $(div).find('img.oipreview').click(function(ev) {
                ev.preventDefault();
                start(player, div);
            });     
            
            if (config.controls == true) {
                $(div).append(createControls());
                var ctrls = $(div).find('ul.controls');
                var timer = $(ctrls).find('li.position');
                
                $(ctrls).find('li.play a').click(function(ev) {
                    ev.preventDefault();
                    if (player.state == 'pause') {
                        player.play();
                        if ($(ctrls).find('li.pause').length == 0) {
                            $(ctrls).find('li.play').addClass('pause');
                        }
                        var slider = $(ctrls).find("li.slider > div");
                        $.oiplayer.follow(player, timer, slider);
                    } else if (player.state == 'play') {
                        player.pause();
                        $(ctrls).find('li.play').removeClass('pause');
                    } else {
                        start(player, div);
                    }
                    //console.log("player state: " + player.state);
                });
                
                $(ctrls).find('li.sound a').click(function(ev){
                    if (player.state != 'init') {
                        player.mute();
                        $(ctrls).find('li.sound').toggleClass('off');
                    }
                });
                $(ctrls).find('li.screen a').click(function(ev){
                    ev.preventDefault();
                    fullscreen(player, div);
                });
                
                console.log("duration: " + player.duration + ", start: " + player.start);
                if (player.duration) {  // else no use
                    $(ctrls).find("li.slider > div").slider({
                            animate: 'fast',
                            range: 'min',
                            value: (player.start ? player.start : 0),
                            max: Math.floor(player.duration),
                            step: 1
                    });
                    $(ctrls).find("li.slider > div").bind('slide', function(ev, ui) {
                        newPos(player, ui.value);
                    });
                    $(ctrls).find("li.slider > div").bind('slidechange', function(ev, ui) {
                        if (ev.originalEvent.type == "mouseup") { 
                            newPos(player, ui.value);
                        }
                    });
                }

            }

        });

        return this; // plugin convention
    });
    
    function newPos(player, pos) {
        player.seek(pos);
        $('li.position').text($.oiplayer.totime(pos));
        $('#value').text("positie: " + pos);
    }

    /* Mainly user interface stuff on first start of playing */
    function start(player, div) {
        if (player.type == 'video') {
            $(div).find('img.oipreview').remove();
        } else {
            $(div).find('img.oipreview').css("z-index", "1");
        }
        $(div).find('div.player').show();
        if (player.info.indexOf("flash") < 0) {
            $(div).find('div.player').empty();
        }
        $(div).find('div.player').append(player.player);
        // for audio? $(player.player).css("z-index", "9");
        player.play();
        if (player.config.controls == true) {
            var ctrls = $(div).find('ul.controls');
            var timer = $(ctrls).find('li.position');
            if ($(ctrls).find('li.pause').length == 0) {
                $(ctrls).find('li.play').addClass('pause');
            }
            var slider = $(ctrls).find("li.slider > div");
            $.oiplayer.follow(player, timer, slider);
        }
    }

    function fullscreen(player, div) {
        if (typeof(player.owidth) == "undefined") {
            player.owidth = player.width;
            player.oheight = player.height;
        }
        var window_w = $(window).width();
        var window_h = $(window).height() - 35;
        var multi_w = window_w / player.owidth;
        var multi_h = window_h / player.oheight;
        var half = 0;
        if (player.width != player.owidth) {
            player.width = player.owidth;
            player.height = player.oheight;
        } else if (multi_h < multi_w) {
            player.width = player.owidth * multi_h;
            player.height = window_h;
            half = (window_w - player.width) / 2;
        } else {
            player.width = window_w;
            player.height = player.oheight * multi_w;
        }
        
        $(div).toggleClass('fullscreen');
        $(div).find('div.player').width(player.width);
        $(div).find('div.controls').width(player.width);
        $(div).find('img.oipreview').width(player.width);
        $(div).find('img.oipreview').height(player.height);
        $(div).find('img.oipreview').css('margin-left', half);
        $(player.player).width(player.width);
        $(player.player).height(player.height);
        var pos;
        if (player.info.indexOf('flash') > -1) {
            pos = parseInt(player.position());
            //player.player.getScreen().animate({width:player.width,height:player.height});
            player.player.unload();
            player.player.play();
        }
        
        $('div.player').find('object').attr("width", player.width);
        $('div.player').find('object').attr("height", player.height);
        if (player.info.indexOf('flash') > -1) {
            setTimeout(function() { player.seek(pos) }, 1000);   // give fp time to reinitialize
        }
    }
    
    /* 
     * Create player
     * @param el        video or audio element
     * @param source    source tags
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
        var html = '<div class="controls"><ul class="controls">' + 
                      '<li class="play"><a title="play" href="#play">play</a></li>' +
                      '<li class="slider"> <div> </div> </li>' +
                      '<li class="position">00:00</li>' +
                      '<li class="sound"><a title="mute" href="#sound">mute</a></li>' + 
                      '<li class="screen"><a title="fullscreen" href="#fullscreen">fullscreen</a></li>' + 
                   '</ul></div>';
        return html;
    }
    
    function showInfo(player) {
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
     * @param el     HTML element to display status
     * @param slider jquery.ui.slider to update
     */
    follow: function (player, el, slider) {
        var pos = 0;
        var progress = null;
        var sec = player.start;
        var now;
        var i = 0;
        clearInterval(progress);
        progress = setInterval(function() {
                pos = player.position();
                sec = Math.floor(pos);
                //console.log("n: " + now + ", s: " + sec + ", pos: " + pos);
                if (!isNaN(pos) && pos > 0 && sec != now) {
                    $(el).text( $.oiplayer.totime(pos) );
                    $(slider).slider('option', 'value', sec);
                    i = 0;
                    now = sec;
                }
                if (now == sec) {
                    i++;
                }
                if (pos == undefined || i > 9) {
                    console.log("stopping... " + i);
                    player.pause(); // maybe stop?
                    clearInterval(progress);
                    return;
                }
            }, 200);
    },
    
    totime: function (pos) {
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
        return toTime(pos);
    }
}



//  ------------------------------------------------------------------------------------------------
//  Prototypes of several players
//  ------------------------------------------------------------------------------------------------

function Player() {
    this.myname = "super";
}
Player.prototype.init = function(el, url, config) { }
Player.prototype.mute = function() { }
Player.prototype.play = function() { }
Player.prototype.pause = function() { }
Player.prototype.position = function() { }
Player.prototype.seek = function(p) { }
Player.prototype.info = function() { }

Player.prototype._init = function(el, url, config) {
    this.player = el;
    this.url = url;
    this.config = config;
    this.type = el.tagName.toLowerCase(); // video or audio
    this.poster = $(this.player).attr('poster');
    //console.log("this.poster: " + this.poster);
    this.autoplay = $(this.player).attr('autoplay');
    if (this.autoplay == undefined) this.autoplay = false;
    this.autobuffer = $(this.player).attr('autobuffer');
    if (this.autobuffer == undefined) this.autobuffer = false;
    this.controls = $(this.player).attr('controls');
    if (this.controls == undefined) this.controls = false;
    this.width  = $(this.player).attr('width') > 0 ? $(this.player).attr('width') : 320;
    this.height = $(this.player).attr('height') > 0 ? $(this.player).attr('height') : 240;;
    //this.duration = $("head meta[name=media-duration]").attr("content"); // not a mediatag attr.
    this.duration = $(el).find("span.duration").text(); // not a mediatag attr.
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
    var timer = $(el).next('ul.controls li.position');
    var slider = $(el).next('ul.controls li.slider > div');
    this.player.addEventListener("playing", 
        function(ev) {
            self.state = 'play';
            $.oiplayer.follow(self, timer, slider);
        }, false);

    this.player.addEventListener("durationchange", 
        function(ev) {
            // console.log("dur: " + self.player.duration);
            /* bug in FF? still NaN after durationchange */
            if (!isNaN(self.player.duration) && self.player.duration > 0) {
                self.duration = self.player.duration;
            }   
        }, false);
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
MediaPlayer.prototype.mute = function() {
    if (this.player.muted) {
        this.player.muted = false;
    } else {
        this.player.muted = true;
    }
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
MediaPlayer.prototype.seek = function(pos) {
    this.player.currentTime = pos;   // float
    if (!this.player.paused) {
        //this.player.play();
    }
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
    var jar = config.server + config.jar;
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
    this.player.doPlay();
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
CortadoPlayer.prototype.mute = function() {
    alert("Sorry. Not supported by Cortado?");
}
CortadoPlayer.prototype.position = function() {
    this.pos = this.player.getPlayPosition();
    return this.pos;
}
CortadoPlayer.prototype.seek = function(pos) {
    // doSeek(double pos); seek to a new position, must be between 0.0 and 1.0.
    // impossible when duration is unknown (and not really smooth in cortado?)
    // seems to be broke anyway (read similar in some MediaWiki cvs posts)
    this.player.doSeek(pos / this.duration);
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
    var flwplayer = config.server + config.flash;
    var duration = (this.duration == undefined ? 0 : Math.round(this.duration));
    
    var ctrls;
    if (this.controls) {
        ctrls = { height: 24, autoHide: 'always', hideDelay: 2000, fullscreen: false };
    } else {
        ctrls = null;
    }
    
    var div = document.createElement('div'); // TODO: add (random) id: adding flowplayer and returning it impossible without id
    $(el).closest('div.oiplayer').html(div);
    $(div).addClass('player');
    this.player = $f(div, { src: flwplayer, width: this.width, height: this.height }, {
        clip: {
            url: this.url,
            autoPlay: this.autoplay,
            duration: duration,
            scaling: 'fit',
            autoBuffering: this.autobuffer,
            bufferLength: 5
        },
        plugins: { controls: ctrls }
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
FlowPlayer.prototype.mute = function() {
    if (this.player.getStatus().muted == true) {
        this.player.unmute();
    } else {
        this.player.mute();
    }
}
FlowPlayer.prototype.position = function() {
    this.pos = this.player.getTime();
    return this.pos;
}
FlowPlayer.prototype.seek = function(pos) {
    this.player.seek(pos);
}
FlowPlayer.prototype.info = function() {
    //return "Playing: " + this.url;
}
