(function () {
  class Player {
    constructor() {
      this.myname = "super";
    }
    init(el, url, config) {
      this._init(el, url, config);
    }
    mute() {}
    play() {}
    pause() {}
    /* current position of audio or video */
    position() {}
    /* go to this position */
    seek(pos) {}
    info() {}
    /* value between 0 - 100 */
    volume(vol) {}
    _init(el, url, config) {
      this.state = "init";
      this.el = el;
      this.player = el;
      this.url = url;
      this.config = config;
      this.type = el.tagName.toLowerCase(); // video or audio
      this.poster = this.player.getAttribute("poster");
      this.autoplay = this.player.getAttribute("autoplay");
      if (this.autoplay === undefined) this.autoplay = false;
      this.autobuffer = this.player.getAttribute("autobuffer");
      if (this.autobuffer === undefined) this.autobuffer = false;
      this.controls = this.player.getAttribute("controls");
      if (this.controls === undefined) this.controls = false;
      if (this.duration === undefined) this.duration = 0;
      this.width = parseInt(this.player.getAttribute("width")) || 320;
      // $(this.player).attr("width") > 0
      //   ? parseInt(this.player.getAttribute("width"))
      //   : 320;
      var default_height = 240;
      if (this.type == "audio") default_height = 32;
      this.height =
        parseInt(this.player.getAttribute("height")) || default_height;
      // $(this.player).attr("height") > 0
      //   ? parseInt(this.player.getAttribute("height"))
      //   : default_height;
      if (this.type == "audio") {
        $(this.player).removeAttr("width").removeAttr("height");
      }
    }
  }
  class MediaPlayer {
    constructor() {
      this.myname = "mediaplayer";
    }
    init(el, url, config) {
      this._init(el, url, config);
      this.url = url;
      if (config.controls) {
        var self = this;
        self.buffered = 0;
        this.player.addEventListener(
          "durationchange",
          function (ev) {
            if (
              !isNaN(self.player.duration) &&
              self.player.duration > 0 &&
              self.player.duration != "Infinity"
            ) {
              self.duration = self.player.duration;
              if (config.log == "info") {
                if ($.oiplayer) {
                  $.oiplayer.msg(self, "set duration: " + self.duration);
                }
              }
              //$(self.ctrls).find('div.timeleft').text("-" + methods.totime(self.duration));
            }
          },
          false
        );
        this.player.addEventListener(
          "progress",
          function (ev) {
            /* FF will support this in v4 */
            if (self.player.buffered && self.player.buffered.length > 0) {
              var buf = self.player.buffered.end(0);
              if (buf > self.buffered) {
                self.buffered = buf;
                var perc = (buf / self.duration) * 100 + "%";
                $(self.ctrls).find("div.loaded").width(perc);
              }
            }
          },
          false
        );
        this.player.addEventListener(
          "canplaythrough",
          function (ev) {
            if (self.player.buffered && self.player.buffered.length > 0) {
              var buf = self.player.buffered.end(0);
              if (buf > self.buffered) {
                self.buffered = buf;
                var perc = (buf / self.duration) * 100 + "%";
                $(self.ctrls).find("div.loaded").width(perc);
              }
            }
          },
          false
        );
        this.player.addEventListener(
          "loadedmetadata",
          function (ev) {
            if (
              self.type == "video" &&
              (self.width == 320 || self.height == 240)
            ) {
              self.width =
                $(self.player).attr("width") > 0
                  ? parseInt($(self.player).attr("width"))
                  : self.player.videoWidth;
              self.height =
                $(self.player).attr("height") > 0
                  ? parseInt($(self.player).attr("height"))
                  : self.player.videoHeight;
              $.oiplayer._controlswidth(self);
              $(self.div).width(self.width).height(self.height);
            }
          },
          false
        );
        this.player.addEventListener(
          "loadeddata",
          function (ev) {
            /* FF will support this in v4 */
            if (self.player.buffered && self.player.buffered.length > 0) {
              var buf = self.player.buffered.end(0);
              if (buf > self.buffered) {
                self.buffered = buf;
                var perc = (buf / self.duration) * 100 + "%";
                $(self.ctrls).find("div.loaded").width(perc);
              }
            }
          },
          false
        );
        this.player.addEventListener(
          "playing",
          function (ev) {
            if (self.state == "init" || self.state == "ended") {
              /* when started outside controls */
              $.oiplayer.start(self);
            }
            self.state = "play";
            $(self.ctrls).find("div.play").addClass("pause");
          },
          false
        );
        this.player.addEventListener(
          "pause",
          function (ev) {
            self.state = "pause";
            $(self.ctrls).find("div.play").removeClass("pause");
          },
          false
        );
        this.player.addEventListener(
          "volumechange",
          function (ev) {
            if (self.player.muted || self.volume() === 0) {
              $(self.ctrls).find("div.sound").addClass("muted");
            } else {
              $(self.ctrls).find("div.sound").removeClass("muted");
            }
          },
          false
        );
        this.player.addEventListener(
          "ended",
          function (ev) {
            if (self.state != "ended") {
              self.state = "ended";
              $(self.div).trigger("oiplayerended", [self]);
            }
            $(self.div).find("div.play").removeClass("pause");
          },
          false
        );
      }
      return this.player;
    }
    play() {
      if (this.player.readyState == "0") {
        this.player.load();
      }
      this.player.play();
      this.state = "play";
    }
    pause() {
      this.player.pause();
      this.state = "pause";
    }
    mute() {
      if (this.player.muted) {
        this.player.muted = false;
      } else {
        this.player.muted = true;
      }
    }
    position() {
      try {
        this.pos = this.player.currentTime;
        return this.pos;
      } catch (err) {
        // $.oiplayer.msg(self, "Error: " + err);
      }
      return -1;
    }
    seek(pos) {
      // TODO: investigate pause() and play() needed?
      //this.player.pause();
      this.player.currentTime = pos; // float

      //this.player.play();
    }
    volume(v) {
      // html5 has range 0.0 to 1.0, we use as in flowplayer 0 - 100
      if (v === undefined) {
        return this.player.volume * 100;
      } else {
        this.player.volume = Math.min(Math.max(v / 100, 0), 1);
      }
    }
    info() {
      /*  duration able in webkit,
              unable in mozilla without: https://developer.mozilla.org/en/Configuring_servers_for_Ogg_media
          */
      //return "Duration: " + this.player.duration + " readyState: " + this.player.readyState;
    }
  }
  MediaPlayer.prototype = new Player();

  class OIPlayer {
    constructor(elem, config) {
      this.elem = elem;
      this.config = config;

      this.init();
    }

    init() {
      // first wrap
      this.div = document.createElement("div");
      const innerdiv = document.createElement("div");
      this.div.classList.add("oiplayer");
      innerdiv.classList.add("player");

      this.elem.replaceWith(this.div);
      innerdiv.appendChild(this.elem);
      this.div.appendChild(innerdiv);

      console.log("INIT", this.urls, this.types);
      const proposal = this.selectPlayer(this.types, this.urls);
      console.log("proposal", proposal);

      switch (proposal.type) {
        case "media":
          this.player = new MediaPlayer();
          break;

        default:
          break;
      }

      this.div.append(this.controlsHtml());
      console.log("ELEM", this.elem);
    }

    /*
     * Selects which player to use and returns a proposal.type and proposal.url.
     * Adapt this to change the prefered order, here the order is: video/audio, cortado, msie_cortado, flash.
     * @param el    video or audio element
     * @param types mimetype (and codec) attributes
     * @param urls  media links
     */
    selectPlayer = (types, urls) => {
      const proposal = {};
      let probably = this.canPlayMedia(types, urls);
      console.log("probably", probably);

      if (probably) {
        proposal.type = "media";
        proposal.url = probably;

        return proposal; // optimization
      } else {
        probably = this.canPlayCortado(types, urls);

        if (
          !probably &&
          (supportMimetype("application/x-java-applet") ||
            navigator.javaEnabled())
        ) {
          // @TODO replace this
          if ($.browser.msie) {
            // Argh! A browser check!
            /* IE always reports true on navigator.javaEnabled(),
                that's why we need to check for the java plugin IE style. 
                It needs an element with id 'clientcaps' somewhere in the page. 
            */
            const javaVersionIE = clientcaps.getComponentVersion(
              "{08B0E5C0-4FCB-11CF-AAA5-00401C608500}",
              "ComponentID"
            );
            if (javaVersionIE) {
              proposal.type = "msie_cortado";
              proposal.url = probably;
            }
            if (el.tagName.toLowerCase() == "audio") {
              // always use cortado on msie
              proposal.type = "msie_cortado";
              proposal.url = probably;
            }
          } else {
            proposal.type = "cortado";
            proposal.url = probably;
          }
        }
      }

      console.log("proposal here", proposal);
      // still no valid proposal try flash
      if (!proposal.type) {
        let flash_url;
        for (let i = 0; i < types.length; i++) {
          if (
            types[i].indexOf("video/flv") > -1 ||
            types[i].indexOf("video/x-flv") > -1
          ) {
            proposal.url = urls[i];
            proposal.type = "flash";
            return proposal;
          }
        }

        for (let j = 0; j < types.length; j++) {
          if (
            types[j].indexOf("video/mp4") > -1
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
    };

    /*
     * Returns (first) url it expects to be able to play with html5 video- or audiotag based on mimetype.
     */
    canPlayMedia = (types, urls) => {
      var vEl = document.createElement("video");
      var aEl = document.createElement("audio");
      if (vEl.canPlayType || aEl.canPlayType) {
        for (var i = 0; i < types.length; i++) {
          if (
            vEl.canPlayType(types[i]) == "probably" ||
            aEl.canPlayType(types[i]) == "probably"
          ) {
            return urls[i]; // this is the best we can do
          }
          if (
            vEl.canPlayType(types[i]) == "maybe" ||
            aEl.canPlayType(types[i]) == "maybe"
          ) {
            return urls[i]; // if we find nothing better
          }
        }
      }
    };

    /*
     * Examines mimetypes and returns belonging ogg url it expects to be able to play.
     */
    canPlayCortado = (types, urls) => {
      for (var i = 0; i < types.length; i++) {
        if (
          types[i].indexOf("video/ogg") > -1 ||
          types[i].indexOf("audio/ogg") > -1 ||
          types[i].indexOf("application/ogg") > -1 ||
          types[i].indexOf("application/x-ogg") > -1
        ) {
          return urls[i];
        }
      }

      return null;
    };

    controlsHtml = () => {
      const htm = `<div class="play"><a href="#play" title="play"></a></div>
        <div class="time">00:00</div>
        <div class="progress">
          <div class="oiprogress">
            <div class="back bar"></div>
            <div class="loaded bar"></div>
            <div class="played bar"></div>
            <div class="oiprogress-container">
              <div class="oiprogress-push">
                <div class="pos"><a href="#pos" title="position"></a></div>
              </div>
            </div>
          </div>
          <div class="timeleft">
            ${-(this.player.position() > 0
              ? this._totime(this.player.duration - this.player.position())
              : this._totime(this.player.duration))}
          </div>
          ${
            this.player.type === "video" && !this._isIphone()
              ? `<div class="screen"><a href="#fullscreen" title="fullscreen"></a></div>`
              : ""
          }
        </div>`;

      const div = document.createElement("div");
      div.classList.add("oipcontrols");
      div.innerHTML = htm;
      return div;

      var html =
        '<div class="oipcontrols">' +
        '<div class="play"><a href="#play" title="play"></a></div>' +
        '<div class="time">00:00</div>' +
        '<div class="progress">' +
        '<div class="oiprogress"><div class="back bar"></div><div class="loaded bar"></div><div class="played bar"></div><div class="oiprogress-container"><div class="oiprogress-push"><div class="pos"><a href="#pos" title="position"></a></div></div></div></div>' +
        "</div>" +
        '<div class="timeleft">-' +
        (player.position() > 0
          ? this._totime(player.duration - player.position())
          : this._totime(player.duration)) +
        "</div>" +
        (player.type == "video" && !this._isIphone()
          ? '<div class="screen"><a href="#fullscreen" title="fullscreen"></a></div>'
          : "") +
        (this._isIpad()
          ? ""
          : '<div class="sound">' +
            '<a href="#sound" title="sound"></a>' +
            (this.config?.controls?.indexOf("volume") > -1
              ? '<div class="volume"><div class="slider">' +
                '<div class="fill"></div><div class="thumb"><div></div></div>' +
                "</div></div>"
              : "") +
            "</div>") +
        "</div>";
    };

    /*
     * Returns time formatted as 00:00
     * @param pos Seconds
     */
    _totime = (pos) => {
      if (pos < 0) {
        pos = 0;
      }

      function toTime(sec) {
        var h = Math.floor(sec / 3600);
        var min = Math.floor(sec / 60);
        sec = Math.floor(sec - min * 60);

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
    };

    /* sorry about these :-( could not find suitable abilities checks */
    _isIphone() {
      // iPhone and iPod act the same
      return navigator.userAgent.match(/iPhone|iPod/i) !== null;
    }

    _isIpad() {
      return navigator.userAgent.match(/iPad/i) !== null;
    }

    get sources() {
      const srcs = this.elem.querySelectorAll("source");
      if (!srcs) {
        srcs[0] = this.elem.getAttribute("src");
      }

      return srcs;
    }

    get types() {
      const results = [];
      this.sources.forEach((src) => results.push(src.type));
      return results;
    }

    get urls() {
      const results = [];
      this.sources.forEach((src) => results.push(src.src));
      return results;
    }
  }

  const elements = document.querySelectorAll(".testplayer");
  console.log("elements", elements);
  elements.forEach((elem) => {
    const media = elem.querySelectorAll("video, audio");
    console.log(media, media.length);

    media.forEach((mt) => {
      const mediaId = mt.getAttribute("id");
      const player = new OIPlayer(mt);
      console.log("player", player);
    });
  });
})();
