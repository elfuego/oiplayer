class Player {
  constructor(el, oiplayer, config) {
    this.myname = "super";
    this._init(el, oiplayer, config);
  }

  mute() {}
  play() {}
  pause() {}
  /* go to this position */
  seek(pos) {}
  info() {}
  /* value between 0 - 100 */
  volume(vol) {}
  _init(el, oiplayer, config) {
    this.state = "init";
    this.el = el;
    this.player = el;
    this.oiplayer = oiplayer;
    this.url = config.url;
    this.config = config;

    this.type = el.tagName.toLowerCase(); // video or audio
    this.poster = this.el.getAttribute("poster");
    this.autoplay = this.el.getAttribute("autoplay");
    if (!this.autoplay) this.autoplay = false;
    this.autobuffer = this.el.getAttribute("autobuffer");
    if (!this.autobuffer) this.autobuffer = false;
    this.controls = this.el.getAttribute("controls") || false;
    if (!this.duration) this.duration = 0;
    if (this.type == "audio") {
      this.el.removeAttribute("width");
      this.el.removeAttribute("height");
    }
  }

  get height() {
    let default_height = 288;
    if (this.type == "audio") default_height = 32;
    return parseInt(this.el.getAttribute("height")) || default_height;
  }

  get width() {
    return parseInt(this.el.getAttribute("width")) || 512;
  }

  get position() {
    return -1;
  }
}

class MediaPlayer extends Player {
  constructor(el, oiplayer, config) {
    super(el, oiplayer, config);

    this.myname = "mediaplayer";
    this.init(el, oiplayer, config);
  }

  init(el, oiplayer, config) {
    this._init(el, oiplayer, config);

    if (config.controls) {
      var self = this;
      self.buffered = 0;
      this.player.addEventListener(
        "durationchange",
        function (ev) {
          console.log("durationchange", self.player.duration);
          if (
            !isNaN(self.player.duration) &&
            self.player.duration > 0 &&
            self.player.duration != "Infinity"
          ) {
            self.duration = self.player.duration;
            // if (config.log == "info") {
            //if ($.oiplayer) {
            // $.oiplayer.msg(self, "set duration: " + self.duration);
            // }
            // }
            //$(self.ctrls).find('div.timeleft').text("-" + methods.totime(self.duration));
            // self.oiplayer.ctrls.progressTime.innerText = `${self.oiplayer._totime(
            //   self.duration
            // )}`;
          }
        },
        false
      );
      this.player.addEventListener(
        "progress",
        function (ev) {
          console.log("progress", self.player.buffered.end);
          /* FF will support this in v4 */
          if (self.player.buffered && self.player.buffered.length > 0) {
            var buf = self.player.buffered.end(0);
            if (buf > self.buffered) {
              self.buffered = buf;
              var perc = (buf / self.duration) * 100 + "%";
              // $(self.ctrls).find("div.loaded").width(perc);
              self.oiplayer.ctrls.progressLoaded.style.width = perc;
            }
          }
        },
        false
      );
      this.player.addEventListener(
        "canplaythrough",
        function (ev) {
          console.log("canplaythrough", self.player.buffered.end);
          if (self.player.buffered && self.player.buffered.length > 0) {
            var buf = self.player.buffered.end(0);
            if (buf > self.buffered) {
              self.buffered = buf;
              var perc = (buf / self.duration) * 100 + "%";
              // $(self.ctrls).find("div.loaded").width(perc);
              self.oiplayer.ctrls.progressLoaded.style.width = perc;
            }
          }
        },
        false
      );
      this.player.addEventListener(
        "loadedmetadata",
        function (ev) {
          console.log("loadedmetadata", self.player.videoWidth);
          if (
            self.type == "video" &&
            (self.width == 320 || self.height == 240)
          ) {
            console.log("loadedmetadata", self.player.videoWidth);
            // self.width =
            //   $(self.player).attr("width") > 0
            //     ? parseInt($(self.player).attr("width"))
            //     : self.player.videoWidth;
            // self.height =
            //   $(self.player).attr("height") > 0
            //     ? parseInt($(self.player).attr("height"))
            //     : self.player.videoHeight;
            // $.oiplayer._controlswidth(self);
            // $(self.div).width(self.width).height(self.height);
          }
        },
        false
      );
      this.player.addEventListener(
        "loadeddata",
        function (ev) {
          console.log("loadeddata", self.duration);
          /* FF will support this in v4 */
          if (self.player.buffered && self.player.buffered.length > 0) {
            var buf = self.player.buffered.end(0);
            if (buf > self.buffered) {
              self.buffered = buf;
              var perc = (buf / self.duration) * 100 + "%";
              //self.ctrls.find("div.loaded").width(perc);
              self.oiplayer.ctrls.progressLoaded.style.width = perc;
            }
          }
        },
        false
      );
      this.player.addEventListener(
        "playing",
        function (ev) {
          console.log("playing", self.position);
          if (self.state == "init" || self.state == "ended") {
            /* when started outside controls */
            // $.oiplayer.start(self);
          }
          self.state = "playing";
          // $(self.ctrls).find("div.play").addClass("pause");
          // self.oiplayer.ctrls.buttonPlay.classList.add("pause");
        },
        false
      );
      this.player.addEventListener(
        "pause",
        function (ev) {
          self.state = "pause";
          // $(self.ctrls).find("div.play").removeClass("pause");
          // self.oiplayer.ctrls.buttonPlay.classList.remove("pause");
        },
        false
      );
      this.player.addEventListener(
        "volumechange",
        function (ev) {
          if (self.player.muted || self.volume() === 0) {
            //$(self.ctrls).find("div.sound").addClass("muted");
          } else {
            //$(self.ctrls).find("div.sound").removeClass("muted");
          }
        },
        false
      );
      this.player.addEventListener(
        "ended",
        function (ev) {
          if (self.state != "ended") {
            self.state = "ended";
            //$(self.div).trigger("oiplayerended", [self]);
          }
          //$(self.div).find("div.play").removeClass("pause");
          // self.oiplayer.ctrls.buttonPlay.classList.remove("pause");
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
    this.state = "playing";
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

  get position() {
    try {
      return this.player.currentTime;
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

(function () {
  class OIPlayer {
    constructor(elem, config) {
      this.id = elem.id || "id" + Math.random().toString(16).slice(2);
      this.type = elem.tagName.toLowerCase();
      this.elem = elem;
      this.following = null;

      this.config = {
        server: "http://www.openimages.eu",
        jar: "/oiplayer/plugins/cortado-ovt-stripped-0.6.0.jar",
        flash: "/oiplayer/plugins/flowplayer-3.2.7.swf",
        controls: true,
        ctrls: {},
        show: true,
        log: "error",
        ...config,
      };

      this.init();
    }

    init() {
      // wrap mediatag
      this.div = document.createElement("div");
      const innerdiv = document.createElement("div");
      this.div.classList.add("oiplayer");
      innerdiv.classList.add("player");

      this.elem.replaceWith(this.div);
      innerdiv.appendChild(this.elem);
      this.div.appendChild(innerdiv);

      const proposal = this.selectPlayer(this.types, this.urls);
      console.log("INIT - proposal", proposal);
      this.config.url = proposal.url;
      this.config.proposalType = proposal.type;

      // this.div.append(this.createPoster(this.player));
      this.div.append(this.controlsHtml());

      const ctrls = {};
      ctrls.buttonPlay = this.div.querySelector('[data-button="play"]');
      ctrls.buttonScreen = this.div.querySelector('[data-button="screen"]');
      ctrls.progressTime = this.div.querySelector('[data-progress="time"]');
      ctrls.progressTotal = this.div.querySelector('[data-progress="total"]');
      ctrls.progressBack = this.div.querySelector('[data-progress="back"]');
      ctrls.progressLoaded = this.div.querySelector('[data-progress="loaded"]');
      ctrls.progressPlayed = this.div.querySelector('[data-progress="played"]');
      ctrls.progressPush = this.div.querySelector('[data-progress="push"]');

      this.ctrls = ctrls;
      console.log("config", this.config);

      switch (proposal.type) {
        case "media":
          this.player = new MediaPlayer(this.elem, this, this.config);
          break;

        default:
          break;
      }

      this.ctrls.buttonPlay.addEventListener("click", (ev) => this.play(ev));
      this.ctrls.buttonScreen.addEventListener("click", (ev) =>
        this.fullscreen(ev)
      );

      this.ctrls.progressLoaded.addEventListener("click", (ev) =>
        this.scrub(ev)
      );

      this.ctrls.progressBack.addEventListener("click", (ev) => this.scrub(ev));
    }

    play(ev) {
      ev.preventDefault();
      console.log("play: ", this.player.state);

      if (this.player.state === "init") {
        this.player.play();
        this.follow();
        this.ctrls.buttonPlay.classList.add("pause");
      } else if (this.player.state === "playing") {
        this.player.pause();
        // this.follow(false);
        this.ctrls.buttonPlay.classList.remove("pause");
      } else {
        this.player.play();
        this.follow();
        this.ctrls.buttonPlay.classList.add("pause");
      }
    }

    fullscreen(ev) {
      ev.preventDefault();
      console.log("fullscreen");
    }

    scrub(ev) {
      ev.preventDefault();
      console.log("scrub");
    }

    follow() {
      const followProgress = () => {
        var perc = ((this.player.position / this.player.duration) * 100).toFixed(1);

        this.ctrls.progressPlayed.style.width = `${1 + Number(perc)}%`;
        this.ctrls.progressPush.style.left = `${perc}%`;

        this.ctrls.progressTotal.innerText = this._totime(this.player.position);
        this.ctrls.progressTime.innerText = `- ${this._totime(
          this.player.duration - this.player.position
        )}`;

        if (this.player.state === "playing") {
          requestAnimationFrame(followProgress);
        }
      };

      requestAnimationFrame(followProgress);
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
      const html = `<div class="play">
          <button data-button="play" title="play"></button>
        </div>
        <div data-progress="total" class="time">00:00</div>
        <div class="progress">
          <div class="oiprogress">
            <div data-progress="back" class="back bar"></div>
            <div data-progress="loaded" class="loaded bar"></div>
            <div data-progress="played" class="played bar"></div>
            <div class="oiprogress-container">
              <div data-progress="push" class="oiprogress-push">
                <div class="pos"><a href="#pos" title="position"></a></div>
              </div>
            </div>
          </div>
          <div data-progress="time" class="timeleft">0:00</div>
          ${
            this.type === "video" && !this._isIphone()
              ? `<div class="screen"><button data-button="screen" title="fullscreen"></button></div>`
              : ""
          }
        </div>`;

      const div = document.createElement("div");
      div.classList.add("oipcontrols");
      div.innerHTML = html;
      return div;

      /* var html =
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
        "</div>"; */
    };

    /**
     * Copies poster and puts it in front, in case of an audio tag it searches for
     * an image and presents that.
     *
     * @param {OIPlayer} player
     * @returns html
     * @memberof OIPlayer
     */
    createPoster(player) {
      let poster = player.poster; // src
      console.log("createPoster", poster);
      if (!poster && player.type === "audio") {
        // for audio-tags (no attribute poster but image inside audio-tag)
        const pic = this.elem.querySelector("img");
        player.width = pic.getAttribute("width") || player.width;
        player.height = pic.getAttribute("height") || player.height;
        console.log("pic", pic);

        /* make height and width of audio those of img inside audio body */
        // var img = $(el).find("img")[0];
        // player.width =
        //   $(img).attr("width") > 0
        //     ? parseInt($(img).attr("width"))
        //     : player.width;
        // player.height =
        //   $(img).attr("height") > 0
        //     ? parseInt($(img).attr("height"))
        //     : player.height;
        // src = $(img).attr("src");
        // $(img).remove();
      }

      if (poster) {
        return `<img class="preview ${player.type}"
          src="${poster}" width="${player.width}" height="${player.height}" 
          alt="click to play" title="click to play" />`;
        // return (
        //   '<img class="preview ' +
        //   player.type +
        //   '" src="' +
        //   poster +
        //   '" width="' +
        //   player.width +
        //   '" height="' +
        //   player.height +
        //   '" alt="click to play" title="click to play" />'
        // );
      }
    }

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
  elements.forEach((elem) => {
    const media = elem.querySelectorAll("video, audio");
    media.forEach((mt) => {
      const player = new OIPlayer(mt);
      console.log("player", player);
    });
  });
})();
