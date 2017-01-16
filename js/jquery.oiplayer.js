/*
 * OIPlayer - jQuery plugin to control html5 video and audio tags and serve alternatives if needed.
 *
 * Copyright (c) 2009-2017 André van Toly
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
 * mediatags in one go. You will have to wrap each mediatag in a div or some other element before 
 * feeding it to the plugin.
 * 
 * Methods to control player include start, pause, jump, volume. For example set volume of media  
 * player with id 'myaudio' to 50 (half) can be done with "$.fn.oiplayer('volume','myaudio', 50);".
 * Values for player.state are init, play, pause and ended.
 * 
 * Uses these parameters and/or the audio/video tag attributes like height, width, poster etc.
 * An audio tag can have an image in its body to use as a poster cq. background.
 * @params:
 *   id - id of the element that contains the media tag
 *   config - configuration parameters
 *       'server' : server url (for Flash or Java in some browsers)
 *       'jar' : location of Cortado JAR file
 *       'flash' : location of flowplayer.swf
 *       'controls' : Use oiplayer controls or not (make sure to include jquery-ui-1.7.2.slider.js for progress slider).
 *                    Simply 'true' means show me controls below player.
 *                    Value 'top' will add a css class of that name and will hide/show controls on top of the player window.
 *                    Add a css class of your own to edit the appearance of the controls (f.e. 'top dark').
                      Still in development: to enable a volume control add 'volume' as a css class.
         'show' : Show controls on start
 *       'log' : when your specify 'info' some debug messages are shown about the media playing 
 *
 * @changes: completely redesigned into a 'true' jQuery plugin, added methods to be reached from 
 *           'outside' - sort of a control API for start, jump etc. - added a volume control.
 *          These include: player, start, pause, volume, jump, msg
 */

(function ($) {

    "use strict";

    var config, methods = {

        /* 
         * Init oiplayer.
         * @param options   configuration
         */
        init: function (options) {

            var config = {
                server: 'http://www.openimages.eu',
                jar: '/oiplayer/plugins/cortado-ovt-stripped-0.6.0.jar',
                flash: '/oiplayer/plugins/flowplayer-3.2.7.swf',
                controls: true,
                show: true,
                log: 'error'
            };

            var current = this;
            var players = [];

            return this.each(function () {
                if (options) {
                    $.extend(config, options);
                }

                var mediatags = $(this).find('video,audio');
                if (mediatags.length === 0) {
                    /* navigate MSIE8 around a bug (?) introduced in jquery 1.4.4 (does not recognize audio or video) 
                    that seems partly fixed in jquery 1.5.1 (does not recognize "video, audio" but recognizes them solo) */
                    mediatags = $(this).find('video');
                    var audiotags = $(this).find('audio');
                    $.merge(mediatags, audiotags);
                }

                $.each(mediatags, function (i, mt) {
                    var mediaId = $(mt).attr('id');
                    var sources = $(mt).find('source');
                    if (sources.length === 0) {
                        /* this may work in older MSIE versions  */
                        sources = $(current).find('source');
                        //alert("src: " + $(sources).attr('src'));
                    }

                    /* video/audio tag is wrapped in a div */
                    if (!isIpad() && !isIphone()) {
                        $(mt).wrap('<div class="oiplayer"><div class="player"></div></div>');
                    }

                    /* create a player (video or audio tag, flowplayer flash, cortado applet) */
                    var div = $(mt).closest('div.oiplayer');
                    var player = createPlayer(mt, sources, config);
                    $(div).addClass(player.type);
                    player.div = div;

                    if (player.myname.indexOf('cortado') > -1) {
                        $(div).find('div.player').empty();
                        $(div).find('div.player').append(player.player);
                        $(div).attr('id', mediaId); // move id to other element
                    }
                    if ((isIpad() || isIphone()) && player.type == 'audio') {
                        $(mt).css('height', '0px').hide(); /* hide audio tag on iPad */
                    }
                    if ((player.myname.indexOf('cortado') > -1 || player.myname == 'flowplayer')) {
                        $(current).find('.html5warning').hide();
                    }

                    var poster = createPoster(div, player);
                    $(div).prepend(poster);
                    $(div).height(player.height).width(player.width);
                    //console.log("ctrls: " + config.controls + " , " + player.url);
                    if (config.controls && player.url !== undefined) {

                        if (isIphone() || isIpad()) {
                            $(mt).after(controlsHtml(player));
                            player.ctrls = $(mt).next('div.oipcontrols');
                            $(player.ctrls).addClass('ios');
                        } else {
                            $(div).append(controlsHtml(player));
                            player.ctrls = $(div).find('div.oipcontrols');
                            $(mt).removeAttr('controls');
                        }
                        if (config.controls === true) {
                            $(div).height($(div).height() + 30); // due to some quirk in webkit
                            player.ctrlspos = 'bottom';

                        } else {
                            if (player.myname.indexOf('cortado') > -1 || isIphone() || isIpad()) {
                                /* remove .top when not compatible */
                                config.controls = config.controls.replace('top', '');
                                if (config.controls.length === 0) {
                                    config.controls = 'white';
                                }
                            }
                            $(player.ctrls).addClass(config.controls);
                            if (config.controls.indexOf('top') > -1) {
                                player.ctrlspos = 'top';
                                if (player.type != 'audio' && player.state != 'init') {
                                    $(player.ctrls).hide();
                                }
                            } else {
                                if (player.type != 'audio') {
                                    //$(div).height( $(div).height() + $(player.ctrls).height() );
                                    $(div).height($(div).height() + 30); // due to some quirk in webkit
                                }
                                player.ctrlspos = 'bottom';
                            }
                        }
                        var ctrlsWidth = controlsWidth(player);
                        if (isIpad() || isIphone() ) {
                            // do nada
                        } else if ((player.type == 'video' || $(player.div).find('img').length > 0)) {
                            $(player.ctrls).css('margin-left', Math.round((player.width - ctrlsWidth) / 2) + 'px');
                        } else {
                            $(player.ctrls).css('margin-left', '0px');
                        }
                    }

                    if (player.url === undefined) { // no compatible sources to play
                        $(div).addClass('inavailable');
                        $(div).append('<p>No compatible source found to play.</p>');
                    }

                    if (config.log == 'info') {
                        methods.msg(player, player.info);
                    }

                    players.push(player);

                    /* would be fairer to attach oiplayer as data to controls? (always present?) */
                    if (mediaId !== undefined && mediaId.length > 0) {
                        //console.log("data mediaId: " + mediaId);
                        $('#' + mediaId).data('oiplayer', {
                            player: player
                        });
                    }
                }); // end for each mt

                /* html ready, bind controls */
                $.each(players, function (i, pl) {
                    $(pl.div).find('.preview').click(function (ev) {
                        ev.preventDefault();
                        methods.start(pl);
                    });

                    if (config.controls) {
                        $(pl.ctrls).find('div.play a').click(function (ev) {
                            ev.preventDefault();
                            if (pl.state == 'pause') {
                                pl.play();
                                if ($(pl.ctrls).find('div.pause').length === 0) {
                                    $(pl.ctrls).find('div.play').addClass('pause');
                                }
                            } else if (pl.state == 'play') {
                                pl.pause();
                                $(pl.ctrls).find('div.play').removeClass('pause');
                            } else {
                                methods.start(pl);
                            }
                            //console.log("player state: " + pl.state);
                        });

                        $(pl.ctrls).find('div.sound a').click(function (ev) {
                            ev.preventDefault();
                            $(pl.ctrls).find('div.sound').toggleClass('muted');
                            pl.mute();
                        });
                        if (config.controls.indexOf('volume') > -1) {
                            methods.volume(pl, 80); // volume slider at 80%
                            $(pl.ctrls).find('div.volume').click(function (ev) {
                                ev.preventDefault();
                                setVolumeFromSliderClick(pl, ev, this);
                            });
                            $(pl.ctrls).find('div.volume div.thumb > div').mousedown(function (ev) {
                                ev.preventDefault();
                                setVolumeFromThumbScrub(pl, ev, this);
                            });
                        }

                        $(pl.ctrls).find('div.screen a').click(function (ev) {
                            ev.preventDefault();
                            fullscreen(pl);
                        });

                        $(pl.ctrls).find('div.loaded, div.back').click(function (ev) {
                            jumpScrubberOnClick(pl, ev);
                        });
                        $(pl.ctrls).find('div.pos a').click(function (ev) {
                            ev.preventDefault();
                        });
                        $(pl.ctrls).find('div.oiprogress-push').mousedown(function (ev) {
                            ev.preventDefault();
                            $(this).find('a').css("background-position", "0 -100px");
                            startScrubbing(pl, ev, this);
                        });

                        // show/hide
                        if (pl.ctrlspos == 'top' && pl.type != 'audio') {
                            if (! config.show) {
                                $(pl.ctrls).hide();
                            }
                            $(pl.div).mouseover(
                                function (ev) {
                                    if (pl.state !== 'init') {
                                        $(pl.ctrls).fadeIn();
                                    }
                                }).mouseleave(
                                function (ev) {
                                    if (pl.state !== 'init') {
                                        $(pl.ctrls).fadeOut('slow');
                                    }
                                }
                            );
                        }
                    } // config.controls

                    $(pl.div).bind("oiplayerended", function (ev, pl) {
                        $(pl.ctrls).fadeIn('slow');
                    });

                });

                function startScrubbing(player, ev, self) {
                    //hidePreview(player);
                    if (player.type == 'video') {
                        $(player.div).find('.preview').fadeOut('normal');
                    }
                    player.prevstate = player.state;
                    player.pause();

                    var width = $(player.ctrls).find('div.oiprogress').innerWidth();
                    player.sPerPx = player.duration / (width - 11);
                    player.startTime = player.position();
                    player.scrubStart = $(self).offset().left;

                    $(player.div).mousemove(function (ev) {
                        updateScrubber(player, ev);
                    });
                    $(player.div).mouseup(function (ev) {
                        $(player.ctrls).find('div.pos a').css("background-position", "0 -75px");
                        endScrubbing(player, ev);
                    });
                }

                function updateScrubber(player, ev) {
                    var pxDelta = ev.pageX - player.scrubStart;
                    var seek = player.startTime + pxDelta * player.sPerPx;
                    if (seek >= player.duration) {
                        seek = player.duration - 0.1;
                    }
                    if (seek < 0) {
                        seek = 0;
                    }
                    methods._seek(player, seek);
                    player.seek(seek);
                }

                function endScrubbing(player, ev) {
                    if (player.prevstate == 'init') {
                        player.state = 'init';
                    }
                    if (player.prevstate == 'play') {
                        player.play();
                    }

                    $(player.div).unbind("mousemove");
                    $(player.div).unbind("mouseup");
                }

                function jumpScrubberOnClick(player, ev) {
                    var width = $(player.ctrls).find('div.oiprogress').innerWidth();
                    var x = ev.pageX - $(player.ctrls).find('div.oiprogress').offset().left - 5;
                    x = Math.max(Math.min(x, width), 0);
                    var seek = (x / width) * player.duration;

                    //hidePreview(player);
                    if (player.type == 'video') {
                        $(player.div).find('.preview').fadeOut('normal');
                    }

                    var perc = (seek / player.duration) * 100;
                    perc = perc + "%";
                    $(player.ctrls).find('div.played').animate({
                        width: perc
                    }, 200);
                    $(player.ctrls).find('div.oiprogress-push').animate({
                            left: perc
                        },
                        200,
                        function () {
                            methods._seek(player, seek);
                        }
                    );
                    player.seek(seek);
                }

                function setVolumeFromSliderClick(player, ev, el) {
                    var iwi = $(el).innerWidth();
                    var x = Math.max(Math.min(ev.pageX - $(el).offset().left, iwi), 0);
                    var vol = (x / iwi) * 100;
                    methods.volume(player, vol); // updates player and interface
                }

                function setVolumeFromThumbScrub(player, ev, el) {
                    var iwi = $(player.ctrls).find('div.volume').innerWidth();
                    var startV = player.volume();
                    var startX = ev.pageX;

                    $(player.div).mousemove(function (e) {
                        var del = e.pageX - startX;
                        var vol = startV + ((del / iwi) * 100);
                        methods.volume(player, vol);
                    });
                    $(player.div).mouseup(function (e) {
                        $(player.div).unbind("mousemove").unbind("mouseleave").unbind("mouseup");
                    });
                    $(player.div).mouseleave(function (e) {
                        $(player.div).unbind("mousemove").unbind("mouseleave").unbind("mouseup");
                    });
                }

                function fullscreen(player) {
                    if (document.fullscreenElement) {
                        //console.log('exit fullscreen');
                        document.exitFullscreen();
                        return;
                    } else if (player.player.requestFullscreen) {
                        //console.log('player.requestFullscreen');
                        player.player.requestFullscreen();
                        return;
                    } else if (player.player.MozRequestFullscreen) {
                        //console.log('player.MozRequestFullscreen');
                        player.player.MozRequestFullscreen();
                        return;
                    } else if (player.player.webkitEnterFullscreen) {
                        //console.log('player.webkitEnterFullscreen');
                        player.player.webkitEnterFullscreen();  // @TODO: deprecated?
                        return;
                    }
                    if (player.owidth === undefined) {
                        player.owidth = player.width;
                        player.oheight = player.height;
                    }
                    $(player.div).toggleClass('fullscreen');

                    // flash stuff
                    var fp_id;
                    if (player.myname == 'flowplayer') {
                        // for flash
                        var pos = player.position();
                        var state = player.state;
                        fp_id = player.player.id();
                        player.player.unload();
                        var pl_div = $(player.div).find('div.player');
                        $(pl_div).empty().attr('id', fp_id); // re-use fp id
                    }

                    if ($(player.div).is('.fullscreen')) {
                        player.origoverflow = document.documentElement.style.overflow;
                        document.documentElement.style.overflow = 'hidden';

                        // new dimensions
                        $(player.div).width('100%').height('100%');
                        player.width = $(window).width();
                        if (player.ctrlspos == 'top') {
                            player.height = $(window).height();
                        } else {
                            player.height = $(player.div).height() - $(player.ctrls).height();
                        }
                        $(player.player).width(player.width).height(player.height);
                        $(player.div).find('div.player').height(player.height);
                        $(player.div).find('.preview').width(player.width).height(player.height);
                        $(window).scrollTop(0).scrollLeft(0);

                        // controls
                        var controls_width = controlsWidth(player);
                        $(player.ctrls).css('margin-left', Math.round((player.width - controls_width) / 2) + 'px');
                        // 'hide' other media players (display:hidden often disables them)
                        $('div.oiplayer').not('.fullscreen').css('margin-left', '-9999px');

                        $(document).bind('keydown', function (ev) {
                            // bind escape key to switch back from fullscreen
                            if (ev.keyCode == 13 || ev.keyCode == 27) {
                                fullscreen(player);
                            }
                        });

                        if (player.ctrlspos == 'top' && player.type != 'audio') {
                            // unbind previous show/hide and let this one take over
                            $(player.div).unbind('mouseover').unbind('mouseleave');
                            $(player.div).mouseover(
                                function (ev) {
                                    $(player.ctrls).fadeIn();
                                }).mouseout(
                                function (ev) {
                                    if (player.state != 'init' && ev.pageY > ($(this).offset().top + $(this).height())) {
                                        $(player.ctrls).fadeOut('slow');
                                    }
                                }
                            );
                        }

                    } else {
                        $(document).unbind('keydown');
                        $('div.oiplayer').css('margin-left', '0'); // show other mediaplayers again
                        document.documentElement.style.overflow = player.origoverflow;

                        // reset dimensions
                        player.width = player.owidth;
                        player.height = player.oheight;
                        $(player.player).width(player.width).height(player.height);
                        $(player.div).find('div.player').height(player.height);
                        $(player.div).find('.preview').width(player.width).height(player.height);

                        // reposition controls
                        if (player.ctrlspos == 'top') {
                            $(player.div).width(player.width).height(player.height);
                        } else {
                            $(player.div).width(player.width).height(player.height + $(player.ctrls).height());
                        }
                        $(player.ctrls).css('margin-left', Math.round((player.width - controlsWidth(player)) / 2) + 'px');

                    }

                    // flash stuff
                    if (player.myname == 'flowplayer') {
                        player.create(fp_id, player.url, player.config); // recreate fp with id
                        setTimeout(function () {
                            player.seek(pos);
                            if (state == 'play') {
                                player.play();
                            }
                        }, 1000); // give fp time to reload
                    }
                }

                /* 
                 * Creates player based upon selected url
                 * @param el        video or audio element
                 * @param source    source tags
                 * @param config    configuration
                 * @return Player
                 */
                function createPlayer(el, sources, config) {
                    var player;
                    var types = $.map(sources, function (i) {
                        return $(i).attr('type');
                    });
                    var urls = $.map(sources, function (i) {
                        return $(i).attr('src');
                    });
                    if (urls.length === 0) { // no sources in body
                        urls[0] = $(el).attr('src');
                        types[0] = "unknown"; // TODO ? 
                    }
                    var eas = extraAttributes(el);

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
                        player.type = "none";
                    }
                    if (eas.duration !== null) {
                        player.duration = eas.duration;
                    }
                    if (eas.start !== null) {
                        player.start = eas.start;
                    }
                    if (eas.id !== null) {
                        player.id = eas.id;
                    }
                    player.info = selectedPlayer.type + ":" + selectedPlayer.url;
                    player.init(el, selectedPlayer.url, config);
                    return player;
                }

                /* 
                 * Selects which player to use and returns a proposal.type and proposal.url. 
                 * Adapt this to change the prefered order, here the order is: video/audio, cortado, msie_cortado, flash.
                 * @param el    video or audio element
                 * @param types mimetype (and codec) attributes
                 * @param urls  media links
                 */
                function selectPlayer(el, types, urls) {
                    var proposal = {};
                    var probably = canPlayMedia(types, urls);
                    if (probably !== undefined) {
                        proposal.type = "media";
                        proposal.url = probably;
                        return proposal; // optimization
                    }
                    if (proposal.type === undefined) {
                        probably = canPlayCortado(types, urls);
                        if (probably !== undefined && (supportMimetype('application/x-java-applet') || navigator.javaEnabled())) {
                            if ($.browser.msie) { // Argh! A browser check!
                                /* IE always reports true on navigator.javaEnabled(),
                                   that's why we need to check for the java plugin IE style. 
                                   It needs an element with id 'clientcaps' somewhere in the page. 
                                */
                                var javaVersionIE = clientcaps.getComponentVersion("{08B0E5C0-4FCB-11CF-AAA5-00401C608500}", "ComponentID");
                                if (javaVersionIE) {
                                    proposal.type = "msie_cortado";
                                    proposal.url = probably;
                                }
                                if (el.tagName.toLowerCase() == 'audio') { // always use cortado on msie
                                    proposal.type = "msie_cortado";
                                    proposal.url = probably;
                                }
                            } else {
                                proposal.type = "cortado";
                                proposal.url = probably;
                            }
                        }
                    }
                    if (proposal.type === undefined) {
                        var flash_url;
                        for (var i = 0; i < types.length; i++) {
                            if (types[i].indexOf("video/flv") > -1 || types[i].indexOf("video/x-flv") > -1) {
                                proposal.url = urls[i];
                                proposal.type = "flash";
                                return proposal;
                            }
                        }
                        for (var j = 0; j < types.length; j++) {
                            if (types[j].indexOf("video/mp4") > -1
                                /* || types[i].indexOf("video/mpeg") > -1 */
                            ) {
                                proposal.url = urls[j];
                                proposal.type = "flash";
                                return proposal;
                            }
                        }
                    }

                    /* try anyway with media tag */
                    if (types.length > 0 && types[0] == "unknown") {
                        proposal.url = urls[0];
                        proposal.type = "media";
                        return proposal;
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
                 * Returns (first) url it expects to be able to play with html5 video- or audiotag based on mimetype.
                 */
                function canPlayMedia(types, urls) {
                    var vEl = document.createElement("video");
                    var aEl = document.createElement("audio");
                    if (vEl.canPlayType || aEl.canPlayType) {
                        for (var i = 0; i < types.length; i++) {
                            if (vEl.canPlayType(types[i]) == "probably" || aEl.canPlayType(types[i]) == "probably") {
                                return urls[i]; // this is the best we can do
                            }
                            if (vEl.canPlayType(types[i]) == "maybe" || aEl.canPlayType(types[i]) == "maybe") {
                                return urls[i]; // if we find nothing better
                            }
                        }
                    }
                }

                function supportMimetype(mt) {
                    var support = false; /* navigator.mimeTypes is unsupported by MSIE ! */
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
                    if (!src && player.type == 'audio') { // for audio-tags (no attribute poster but image inside audio-tag)
                        var img = $(el).find('img')[0];
                        /* make height and width of audio those of img inside audio body */
                        player.width = $(img).attr('width') > 0 ? parseInt($(img).attr('width')) : player.width;
                        player.height = $(img).attr('height') > 0 ? parseInt($(img).attr('height')) : player.height;
                        src = $(img).attr('src');
                        $(img).remove();
                    }
                    if (src) {
                        return '<img class="preview ' + player.type + '" src="' + src + '" width="' + player.width + '" height="' + player.height + '" alt="click to play" title="click to play" />';
                    }
                }

                function controlsHtml(player) {
                    var html = '<div class="oipcontrols">' +
                        '<div class="play"><a href="#play" title="play"></a></div>' +
                        '<div class="time">00:00</div>' +
                        '<div class="progress">' +
                        '<div class="oiprogress"><div class="back bar"></div><div class="loaded bar"></div><div class="played bar"></div><div class="oiprogress-container"><div class="oiprogress-push"><div class="pos"><a href="#pos" title="position"></a></div></div></div></div>' +
                        '</div>' +
                        '<div class="timeleft">-' + (player.position() > 0 ? methods._totime(player.duration - player.position()) : methods._totime(player.duration)) + '</div>' +
                        (player.type == 'video' && !isIphone() ? '<div class="screen"><a href="#fullscreen" title="fullscreen"></a></div>' : '') +
                        (isIpad() ? '' : '<div class="sound">' +
                            '<a href="#sound" title="sound"></a>' +
                                ((config.controls.indexOf('volume') > -1) ? '<div class="volume"><div class="slider">' +
                                    '<div class="fill"></div><div class="thumb"><div></div></div>' +
                                '</div></div>' : '') +
                            '</div>') +
                        '</div>';
                    return html;
                }

                function controlsWidth(player) {
                    var controls_width = player.width;
                    if (player.ctrlspos == 'top') controls_width = player.width - 32;
                    if (controls_width > 620) {
                        controls_width = 620;
                    }
                    $(player.ctrls).width(controls_width);
                    $(player.ctrls).find('div.sliderwrap').width(controls_width - 190);
                    return controls_width;
                }

                /*
                 * Returns attributes and values hidden in classes of an element, f.e. oip_ea_attr_value
                 */
                function extraAttributes(el) {
                    var attributes = {};
                    if ($(el).attr("class")) {
                        var classes = $(el).attr("class").split(' ');
                        for (var i in classes) {
                            var cl = classes[i];
                            if (cl.indexOf("oip_ea_") == -1) continue;
                            var a = cl.substring("oip_ea_".length);
                            var v = a.indexOf("_");
                            attributes[a.substring(0, v)] = a.substring(v + 1);
                        }
                    }
                    return attributes;
                }

                /* sorry about these :-( could not find suitable abilities checks */
                function isIphone() { // iPhone and iPod act the same 
                    return navigator.userAgent.match(/iPhone|iPod/i) !== null;
                }

                function isIpad() {
                    return navigator.userAgent.match(/iPad/i) !== null;
                }
            });

        },
        /* here ends init */


        //  ------------------------------------------------------------------------------------------------
        //  Global functions
        //  ------------------------------------------------------------------------------------------------


        /* 
         * Get player object with id from data previously attached to it.
         * @param id of player
         */
        player: function (id) {
            if ($('#' + id).length > 0) {
                var data = $('#' + id).data('oiplayer');
                return data.player;
            }
        },

        /* 
         * Start player, jumps to position first if given.
         * @param player Video or audio oiplayer object or id of video or audio tag
         * @param pos    Position to jump to before starting, ignored when empty.
         */
        start: function (player, pos) {
            if (player.myname === undefined) player = methods.player(player);
            if (player.state == 'init' || player.state == 'ended' || player.fpstate === undefined) {
                $(player.div).trigger("oiplayerplay", [player]);
            }

            // hide preview
            if (player.type == 'video') {
                $(player.div).find('.preview').fadeOut('normal');
            } else {
                $(player.div).find('.preview').css("z-index", "1");
            }

            if (pos > 0) {
                methods.jump(player, pos);
            }

            if (player.config.controls) {
                $(player.ctrls).find('div.play').addClass('pause');
                if (player.state == 'init') {
                    methods._follow(player);
                }
                if (player.fpstate === undefined) {
                    methods._follow(player);
                }
            }
            player.play();
            if (player.config.log == 'info') {
                methods.msg(player, "Playing... " + player.info + " (" + player.duration + ")");
            }
        },

        /* 
         * Pause playing of audio or video.
         * @param player Object of player or id
         */
        pause: function (player) {
            if (player.myname === undefined) player = methods.player(player);
            player.pause();
        },

        /* 
         * Set volume of audio or video.
         * @param player    Object of player or id
         * @param vol       Volume between 0 - 100
         */
        volume: function (player, v) {
            if (player.myname === undefined) player = methods.player(player);
            if (v === undefined) {
                return player.volume();
            } else {
                var vol = Math.max(Math.min(v, 100), 0);
                player.volume(vol);
                $(player.ctrls).find('div.volume div.fill').css('width', vol + '%');
                $(player.ctrls).find('div.volume div.thumb > div').css('left', vol + '%');
            }
        },

        /* 
         * Jump player to positon in video or audio.
         * @param player Object of player or id
         * @param pos    Position to jump to
         */
        jump: function (player, pos) {
            if (player.myname === undefined) player = methods.player(player);
            if (player.type == 'video') {
                $(player.div).find('.preview').fadeOut('normal');
            } else {
                $(player.div).find('.preview').css("z-index", "1");
            }

            methods._seek(player, pos);
            player.seek(pos);
        },

        /* 
         * Current position in seconds in video or audio.
         * @param player Object of player or id
         * @return position in seconds
         */
        position: function (player, el) {
            if (player.myname === undefined) player = methods.player(player);
            return player.position();
        },

        /* 
         * Can come in handy in stead of using 'console.log("bla")' in some browsers,
         * f.e.: '$.oiplayer.msg(this.player, "Play: " + this.url)'.
         * @param player Object of player
         * @param msg    Message
         */
        msg: function (player, msg) {
            if (player.myname === undefined) player = methods.player(player);
            $('<div class="oiplayerinfo"></div>').text(msg).insertAfter(player.div).hide().fadeIn();
        },

        /* 
         * Updates CSS position of slider / scrubber. 
         * @param player Object of player
         * @param pos    Position in media
         */
        _seek: function (player, pos) {
            if (!isNaN(pos) && pos > 0) {
                var perc = (pos / player.duration) * 100;
                perc = perc + "%";
                $(player.ctrls).find('div.played').width((1 + ((pos / player.duration) * 100)) + "%");
                $(player.ctrls).find('div.oiprogress-push').css('left', perc);
                if (player.duration > 0) {
                    $(player.ctrls).find('div.timeleft').text("-" + methods._totime(player.duration - pos));
                }
                $(player.ctrls).find('div.time').text(methods._totime(pos));
                //prevpos = pos;
            }

            /* .time .timeleft .changed */
            $(player.ctrls).find('div.time').text(methods._totime(pos));
            $(player.ctrls).find('div.timeleft').text('-' + methods._totime(player.duration - pos));
            if (pos > 0) {
                $(player.ctrls).find('div.progress').addClass('changed');
            } else {
                $(player.ctrls).find('div.progress').removeClass('changed');
            }
        },

        /* 
         * Follows progress of player and calls interface update
         * @param player Object of player
         */
        _follow: function (player) {
            var i = 0,
                now = 0,
                progress = null;
            player.fpstate = 'following';
            clearInterval(progress);
            progress = setInterval(function () {
                var pos = player.position();
                if (pos != now) {
                    now = pos;
                } else {
                    i++;
                }
                /* player is paused while scrubbing */
                if (player.state != 'pause' && player.state != 'ended') {
                    methods._seek(player, pos);
                }
                if (i > 999) {
                    clearInterval(progress);
                }
            }, 100);
        },

        _controlswidth: function (player) {
            var controls_width;
            if (player.ctrlspos == 'top') {
                controls_width = player.width - 32;
            } else {
                controls_width = player.width;
            }
            if (controls_width > 620) {
                controls_width = 620;
            }
            $(player.ctrls).width(controls_width);
            $(player.ctrls).find('div.sliderwrap').width(controls_width - 190);
            return controls_width;
        },

        /* 
         * Returns time formatted as 00:00
         * @param pos Seconds
         */
        _totime: function (pos) {
            if (pos < 0) {
                pos = 0;
            }

            function toTime(sec) {
                var h = Math.floor(sec / 3600);
                var min = Math.floor(sec / 60);
                sec = Math.floor(sec - (min * 60));
                if (h >= 1) {
                    min -= h * 60;
                    return h + ":" + addZero(min) + ":" + addZero(sec);
                }
                return addZero(min) + ":" + addZero(sec);
            }

            function addZero(time) {
                time = parseInt(time, 10);
                return time < 10 ? "0" + time : time;
            }
            return toTime(Math.floor(pos));
        }
    };

    $.fn.oiplayer = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.oiplayer');
        }
    };

    //  ------------------------------------------------------------------------------------------------
    //  Prototypes of several players
    //  ------------------------------------------------------------------------------------------------

    function Player() {
        this.myname = "super";
    }
    Player.prototype.init = function (el, url, config) {
        this._init(el, url, config);
    };
    Player.prototype.mute = function () {};
    Player.prototype.play = function () {};
    Player.prototype.pause = function () {};
    /* current position of audio or video */
    Player.prototype.position = function () {};
    /* go to this position */
    Player.prototype.seek = function (pos) {};
    Player.prototype.info = function () {};
    /* value between 0 - 100 */
    Player.prototype.volume = function (vol) {};

    Player.prototype._init = function (el, url, config) {
        this.state = 'init';
        this.el = el;
        this.player = el;
        this.url = url;
        this.config = config;
        this.type = el.tagName.toLowerCase(); // video or audio
        this.poster = $(this.player).attr('poster');
        this.autoplay = $(this.player).attr('autoplay');
        if (this.autoplay === undefined) this.autoplay = false;
        this.autobuffer = $(this.player).attr('autobuffer');
        if (this.autobuffer === undefined) this.autobuffer = false;
        this.controls = $(this.player).attr('controls');
        if (this.controls === undefined) this.controls = false;
        if (this.duration === undefined) this.duration = 0;
        this.width = $(this.player).attr('width') > 0 ? parseInt($(this.player).attr('width')) : 320;
        var default_height = 240;
        if (this.type == 'audio') default_height = 32;
        this.height = $(this.player).attr('height') > 0 ? parseInt($(this.player).attr('height')) : default_height;
        if (this.type == 'audio') {
            $(this.player).removeAttr('width').removeAttr('height');
        }
    };

    function MediaPlayer() {
        this.myname = "mediaplayer";
    }
    MediaPlayer.prototype = new Player();
    MediaPlayer.prototype.init = function (el, url, config) {
        this._init(el, url, config);
        this.url = url;
        if (config.controls) {
            var self = this;
            self.buffered = 0;
            this.player.addEventListener("durationchange",
                function (ev) {
                    if (!isNaN(self.player.duration) && self.player.duration > 0 && self.player.duration != 'Infinity') {
                        self.duration = self.player.duration;
                        if (config.log == 'info') {
                            if ($.oiplayer) {
                                $.oiplayer.msg(self, "set duration: " + self.duration);
                            }
                        }
                        //$(self.ctrls).find('div.timeleft').text("-" + methods.totime(self.duration));
                    }
                }, false);
            this.player.addEventListener("progress",
                function (ev) { /* FF will support this in v4 */
                    if (self.player.buffered && self.player.buffered.length > 0) {
                        var buf = self.player.buffered.end(0);
                        if (buf > self.buffered) {
                            self.buffered = buf;
                            var perc = (buf / self.duration) * 100 + '%';
                            $(self.ctrls).find('div.loaded').width(perc);
                        }
                    }
                }, false);
            this.player.addEventListener("canplaythrough",
                function (ev) {
                    if (self.player.buffered && self.player.buffered.length > 0) {
                        var buf = self.player.buffered.end(0);
                        if (buf > self.buffered) {
                            self.buffered = buf;
                            var perc = (buf / self.duration) * 100 + '%';
                            $(self.ctrls).find('div.loaded').width(perc);
                        }
                    }
                }, false);
            this.player.addEventListener("loadedmetadata",
                function (ev) {
                    if (self.type == 'video' && (self.width == 320 || self.height == 240)) {
                        self.width = $(self.player).attr('width') > 0 ? parseInt($(self.player).attr('width')) : self.player.videoWidth;
                        self.height = $(self.player).attr('height') > 0 ? parseInt($(self.player).attr('height')) : self.player.videoHeight;
                        $.oiplayer._controlswidth(self);
                        $(self.div).width(self.width).height(self.height);
                    }
                }, false);
            this.player.addEventListener("loadeddata",
                function (ev) { /* FF will support this in v4 */
                    if (self.player.buffered && self.player.buffered.length > 0) {
                        var buf = self.player.buffered.end(0);
                        if (buf > self.buffered) {
                            self.buffered = buf;
                            var perc = (buf / self.duration) * 100 + '%';
                            $(self.ctrls).find('div.loaded').width(perc);
                        }
                    }
                }, false);
            this.player.addEventListener("playing",
                function (ev) {
                    if (self.state == 'init' || self.state == 'ended') { /* when started outside controls */
                        $.oiplayer.start(self);
                    }
                    self.state = 'play';
                    $(self.ctrls).find('div.play').addClass('pause');
                }, false);
            this.player.addEventListener("pause",
                function (ev) {
                    self.state = 'pause';
                    $(self.ctrls).find('div.play').removeClass('pause');
                }, false);
            this.player.addEventListener("volumechange",
                function (ev) {
                    if (self.player.muted || self.volume() === 0) {
                        $(self.ctrls).find('div.sound').addClass('muted');
                    } else {
                        $(self.ctrls).find('div.sound').removeClass('muted');
                    }
                }, false);
            this.player.addEventListener("ended",
                function (ev) {
                    if (self.state != 'ended') {
                        self.state = 'ended';
                        $(self.div).trigger("oiplayerended", [self]);
                    }
                    $(self.div).find('div.play').removeClass('pause');
                }, false);
        }
        return this.player;
    };
    MediaPlayer.prototype.play = function () {
        if (this.player.readyState == '0') {
            this.player.load();
        }
        this.player.play();
        this.state = 'play';
    };
    MediaPlayer.prototype.pause = function () {
        this.player.pause();
        this.state = 'pause';
    };
    MediaPlayer.prototype.mute = function () {
        if (this.player.muted) {
            this.player.muted = false;
        } else {
            this.player.muted = true;
        }
    };
    MediaPlayer.prototype.position = function () {
        try {
            this.pos = this.player.currentTime;
            return this.pos;
        } catch (err) {
            $.oiplayer.msg(self, "Error: " + err);
        }
        return -1;
    };
    MediaPlayer.prototype.seek = function (pos) {
        // TODO: investigate pause() and play() needed?
        //this.player.pause();
        this.player.currentTime = pos; // float
        //this.player.play();
    };
    MediaPlayer.prototype.volume = function (v) {
        // html5 has range 0.0 to 1.0, we use as in flowplayer 0 - 100
        if (v === undefined) {
            return this.player.volume * 100;
        } else {
            this.player.volume = Math.min(Math.max(v / 100, 0), 1);
        }
    };
    MediaPlayer.prototype.info = function () {
        /*  duration able in webkit, 
            unable in mozilla without: https://developer.mozilla.org/en/Configuring_servers_for_Ogg_media
        */
        //return "Duration: " + this.player.duration + " readyState: " + this.player.readyState;
    };

    function CortadoPlayer() {
        this.myname = "cortadoplayer";
    }
    CortadoPlayer.prototype = new Player();
    CortadoPlayer.prototype.init = function (el, url, config) {
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
        if (this.width) $(this.player).attr('width', this.width);
        if (this.height) $(this.player).attr('height', this.height);
        var params = {
            'code': 'com.fluendo.player.Cortado.class',
            'archive': jar,
            'url': url,
            // 'local': 'false',
            'duration': Math.round(this.duration),
            'keepAspect': 'true',
            'showStatus': this.controls,
            'video': usevideo,
            'audio': 'true',
            'seekable': 'auto',
            'autoPlay': this.autoplay,
            'bufferSize': '256',
            'bufferHigh': '50',
            'bufferLow': '5'
        };
        for (var name in params) {
            var p = document.createElement('param');
            p.name = name;
            p.value = params[name];
            this.player.appendChild(p);
        }
        return this.player;
    };

    CortadoPlayer.prototype.play = function () {
        this.player.doPlay();
        this.state = 'play';
    };
    CortadoPlayer.prototype.pause = function () {
        this.player.doPause();
        this.state = 'pause';
        if (this.position() >= this.duration) {
            this.state = 'ended';
            $(this.div).trigger("oiplayerended", [this]);
            try {
                this.player.doStop();
            } catch (err) {}
        }
    };
    CortadoPlayer.prototype.mute = function () {
        $.oiplayer.msg(this, "Sorry. Cortado currently does not support changing volume with Javascript.");
    };
    CortadoPlayer.prototype.volume = function (v) {
        $.oiplayer.msg(this, "Sorry. Cortado currently does not support changing volume with Javascript.");
    };
    CortadoPlayer.prototype.position = function () {
        if (this.state != 'init') {
            this.pos = this.player.getPlayPosition();
            return this.pos;
        } else {
            return 0;
        }
    };
    CortadoPlayer.prototype.seek = function (pos) {
        // doSeek(double pos); seek to a new position, must be between 0.0 and 1.0.
        // impossible when duration is unknown (and not really smooth in cortado?)
        // seems to be broke anyway (read similar in some MediaWiki cvs posts)
        this.player.doSeek(pos / this.duration);
    };
    CortadoPlayer.prototype.info = function () {
        //return "Playing: " + this.url";
    };

    function MSCortadoPlayer() {
        this.myname = "msie_cortadoplayer";
    }
    MSCortadoPlayer.prototype = new CortadoPlayer();
    MSCortadoPlayer.prototype.init = function (el, url, config) {
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
            '<object classid="clsid:8AD9C840-044E-11D1-B3E9-00805F499D93" ' +
            '  codebase="http://java.sun.com/update/1.5.0/jinstall-1_5_0-windows-i586.cab" ' +
            //'  id="msie_cortadoplayer_' + id + '" '+
            '  id="msie_cortadoplayer_oiplayer"' +
            '  allowscriptaccess="always" width="' + this.width + '" height="' + useheight + '">' +
            ' <param name="code" value="com.fluendo.player.Cortado" />' +
            ' <param name="archive" value="' + jar + '" />' +
            ' <param name="url" value="' + this.url + '" /> ' +
            ' <param name="duration" value="' + Math.round(this.duration) + '" /> ' +
            ' <param name="local" value="true" /> ' +
            ' <param name="keepAspect" value="true" /> ' +
            ' <param name="video" value="' + usevideo + '" /> ' +
            ' <param name="audio" value="true" /> ' +
            ' <param name="seekable" value="auto" /> ' +
            ' <param name="showStatus" value="' + this.controls + '" /> ' +
            ' <param name="bufferSize" value="256" /> ' +
            ' <param name="bufferHigh" value="50" /> ' +
            ' <param name="bufferLow" value="5" /> ' +
            ' <param name="autoPlay" value="' + this.autoplay + '" /> ' +
            ' <strong>Your browser does not have a Java Plug-in. <a href="http://java.com/download">Get the latest Java Plug-in here</a>.</strong>' +
            '</object>';
        $(element).html(obj_html);
        this.player = element.firstChild;
        return this.player;
    };

    function FlowPlayer() {
        this.myname = "flowplayer";
    }
    FlowPlayer.prototype = new Player();
    FlowPlayer.prototype.init = function (el, url, config) {
        this._init(el, url, config);
        var div = document.createElement('div');
        $(el).closest('div.oiplayer').html(div);
        var mediaId = $(el).attr('id');
        $(div).attr('id', mediaId); // move id to other element cause video tag is replaced with flash
        $(div).addClass('player');
        return this.create(div, url, config);
    };
    FlowPlayer.prototype.create = function (el, url, config) {
        var flwplayer = config.server + config.flash;
        var duration = (this.duration === undefined ? 0 : Math.round(this.duration));
        //alert('appending to ' + $(el).attr('class'));
        this.player = $f(el, {
            src: flwplayer,
            width: this.width,
            height: this.height,
            wmode: 'opaque'
        }, {
            clip: {
                url: this.url,
                autoPlay: this.autoplay,
                duration: duration,
                scaling: 'fit',
                autoBuffering: true
                    //bufferLength: 3
            },
            plugins: {
                controls: null
            }
        });

        if (config.controls) {
            var self = this;
            var clip = this.player.getCommonClip();
            this.player.onMute(function () {
                $(self.div).find('div.sound').addClass('muted');
            });
            this.player.onUnmute(function () {
                $(self.div).find('div.sound').removeClass('muted');
            });
            this.player.onVolume(function () {
                if (self.player.getStatus().muted || self.volume() === 0) {
                    $(self.ctrls).find('div.sound').addClass('muted');
                } else {
                    $(self.ctrls).find('div.sound').removeClass('muted');
                }
            });
            this.player.onLoad(function () {
                var checkDuration = null;
                clearInterval(checkDuration);
                checkDuration = setInterval(function () {
                    if (self.duration < 1) {
                        var fd = self.player.getCommonClip().fullDuration;
                        try {
                            fd = self.player.getCommonClip().fullDuration;
                        } catch (err) {}
                        if (fd > 0) {
                            self.duration = fd;
                        }
                    } else {
                        clearInterval(checkDuration);
                        if (config.log == 'info') {
                            $.oiplayer.msg(self, "set duration: " + self.duration);
                        }
                        try {
                            var bufferStatus = self.player.getStatus().bufferEnd;
                            var perc = (bufferStatus / self.duration) * 100;
                            perc = perc + "%";
                            $(self.div).find('div.loaded').width(perc);
                        } catch (err) {}
                    }
                }, 500);
            });
            clip.onBufferFull(function () {
                /* means enough buffer to play (not necessarily completely downloaded, fp has no means to track progress) */
                //$(self.div).find('div.loaded').width('100%');
            });
            clip.onStart(function () {
                /* Seems duration is not available until start: http://flowplayer.org/forum/3/18755 
                   With 'autoBuffering: true' clip starts automatically and pauses at first frame. */
                var fd = self.player.getClip().fullDuration;
                if (fd > 0) {
                    self.duration = fd;
                }
                if (self.autoplay) {
                    $.oiplayer._follow(self);
                    $.oiplayer.hidepreview(self);
                    $(self.div).find('div.play').addClass('pause');
                    self.state = 'play';
                }
                if (self.fpstate == 'ended') {
                    $.oiplayer.start(self);
                }
            });
            clip.onPause(function () {
                $(self.div).find('div.play').removeClass('pause');
                self.state = 'pause';
            });
            clip.onResume(function () {
                $(self.div).find('div.play').addClass('pause');
                if (self.fpstate === undefined && self.duration > 0) {
                    $.oiplayer.start(self);
                }
                self.state = 'play';
            });
            clip.onFinish(function () {
                self.fpstate = 'ended';
                if (self.state != 'ended') {
                    self.state = 'ended';
                    $(self.div).trigger("oiplayerended", [self]);
                }
                $(self.div).find('div.play').removeClass('pause');
            });
        }
        return this.player;
    };
    FlowPlayer.prototype.play = function () {
        /* flowplayer states:
        -1	unloaded
        0	loaded
        1	unstarted
        2	buffering
        3	playing
        4	paused
        5	ended */
        if (this.player.getState() == 4) {
            this.player.resume();
        } else {
            this.player.play();
        }
        this.state = 'play';
    };
    FlowPlayer.prototype.pause = function () {
        if (this.player.getState() == 3) this.player.pause();
        this.state = 'pause';
    };
    FlowPlayer.prototype.mute = function () {
        if (this.player.getStatus().muted === true) {
            this.player.unmute();
        } else {
            this.player.mute();
        }
    };
    FlowPlayer.prototype.position = function () {
        this.pos = parseInt(this.player.getTime());
        return this.pos;
    };
    FlowPlayer.prototype.seek = function (pos) {
        pos = parseInt(pos);
        this.player.seek(pos);
    };
    FlowPlayer.prototype.volume = function (v) {
        /* in fp an integer: 0-100 */
        if (v === undefined) {
            return this.player.getVolume();
        } else {
            this.player.setVolume(v);
        }
    };
    FlowPlayer.prototype.info = function () {
        //return "Playing: " + this.url;
    };

})(jQuery);
