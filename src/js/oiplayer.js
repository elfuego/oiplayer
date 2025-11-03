class Player {
  constructor(media, oiplayer, config) {
    this.media = media;
    this.oiplayer = oiplayer;
    this.config = config;
    this.myname = "super";

    this.init();
  }

  mute() {}
  play() {}
  pause() {}
  /* go to this position */
  seek(sec) {}
  info() {}
  /* value between 0 - 100 */
  volume(vol) {}
  init() {
    this.state = "init";
    this.updatedMetadata = 0;
    // this.url = config.url;

    this.poster = this.media.getAttribute("poster");
    this.autoplay = this.media.getAttribute("autoplay");
    if (!this.autoplay) this.autoplay = false;
    this.autobuffer = this.media.getAttribute("autobuffer");
    if (!this.autobuffer) this.autobuffer = false;
    // this.controls = this.media.getAttribute("controls") || false;
    // if (this.type == "audio") {
    //   this.el.removeAttribute("width");
    //   this.el.removeAttribute("height");
    // }
  }

  get height() {
    const default_height = this.type === "audio" ? 32 : 288;
    return parseInt(this.media.getAttribute("height")) || default_height;
  }

  get width() {
    return parseInt(this.media.getAttribute("width")) || 512;
  }

  // media duration
  get length() {
    return -1;
  }

  get position() {
    return 0;
  }

  get type() {
    return this.media.tagName.toLowerCase(); // video or audio
  }
}

class MediaPlayer extends Player {
  constructor(media, oiplayer, config) {
    super(media, oiplayer, config);

    this.myname = "mediaplayer";
  }

  init() {
    super.init();
    this.eventHandlers();
    console.log("mediaplayer", this);
  }

  eventHandlers() {
    this.media.addEventListener("loadedmetadata", () => {
      // console.log("loadedmetadata", this.media.duration);
      this.metadataLoaded();
    });

    this.media.addEventListener("timeupdate", () => {
      if (this.updatedMetadata < 1) {
        // on some (mobile) browsers 'loadedmetadata' does not succeed in a correct value
        // console.log("timeupdate duration", this.media.duration);
        this.metadataLoaded();
      }
    });

    // https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/buffering_seeking_time_ranges
    // this.media.addEventListener("progress", () => {
    //   const duration = this.media.duration;
    //   if (duration > 0) {
    //     for (let i = 0; i < this.media.buffered.length; i++) {
    //       if (this.media.buffered.start(this.media.buffered.length - 1 - i) < this.media.currentTime) {
    //         // document.getElementById("buffered-amount").style.width = `${
    //         console.log("progress", (this.media.buffered.end(this.media.buffered.length - 1 - i) * 100) / duration);
    //         // }%`;
    //         break;
    //       }
    //     }
    //   }
    // });

    this.media.addEventListener("playing", () => (this.state = "playing"));
    this.media.addEventListener("paused", () => (this.state = "paused"));
    this.media.addEventListener("ended", () => (this.state = "ended"));
  }

  metadataLoaded() {
    const duration = this.media.duration;
    console.log("updateMetadata", this.updatedMetadata, duration);
    if (!Number.isFinite(duration)) {
      return;
    }

    const meta = {
      duration,
      height: this.media.videoHeight ? this.media.videoHeight : -1,
      width: this.media.videoWidth ? this.media.videoWidth : -1,
    };

    this.oiplayer.updateMetadata(meta);
    this.updatedMetadata += 1;
  }

  static canPlay(media) {
    const sources = media.querySelectorAll("source");
    let proposal = {
      canplay: "",
      proposal: "media",
    };

    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType
    sources.forEach((src) => {
      switch (media.canPlayType(src.type)) {
        case "probably":
          if (proposal.canplay !== "probably") {
            proposal = {
              ...proposal,
              canplay: "probably",
              mimetype: src.type,
              url: src.src,
            };
          }
          break;
        case "maybe":
          if (proposal.canplay !== "probably") {
            proposal = {
              ...proposal,
              canplay: "maybe",
              mimetype: src.type,
              url: src.src,
            };
          }
          break;
        default:
          break;
      }
    });

    return proposal;
  }

  play() {
    if (this.media.paused || this.media.ended) {
      this.media.play();
      this.state = "playing";
    } else {
      this.media.pause();
      this.state = "paused";
    }
  }

  pause = () => this.media.pause();

  seek = (sec) => {
    if (this.media.fastSeek) {
      this.media.fastSeek(sec);
    } else {
      this.media.currentTime = sec;
    }
  };

  volume = (vol) => {
    console.log("volume", vol);
    this.media.muted = !this.media.muted;
    this.oiplayer.muted = this.media.muted;
  };

  get length() {
    return this.media.duration;
  }

  get position() {
    return this.media.currentTime;
  }
}

class CortadoPlayer extends Player {
  constructor(media, oiplayer, config) {
    super(media, oiplayer, config);

    this.myname = "cortadoplayer";
  }

  init() {
    super.init();

    this.player = this.createPlayerObject();
  }

  createPlayerObject() {
    const { jar, server, url }  = this.config;
    const jarArchive = server + jar;
    console.log("createPlayerObject cortado", jarArchive, this.length);

    const player = document.createElement("object");
    player.setAttribute("classid", "java:com.fluendo.player.Cortado.class");
    // player.setAttribute("style", "display:block;width:" + this.width + "px;height:" + useheight + "px;");
    player.setAttribute("type", "application/x-java-applet");
    player.setAttribute("archive", jar);
    player.setAttribute("height", this.height);
    player.setAttribute("width", this.width);

    const params = {
      code: "com.fluendo.player.Cortado.class",
      archive: jarArchive,
      url: url,
      // 'local': 'false',
      duration: Math.round(this.length),
      keepAspect: "true",
      showStatus: "true",
      video: "true",
      audio: "true",
      seekable: "auto",
      autoPlay: this.autoplay || false,
      bufferSize: "256",
      bufferHigh: "50",
      bufferLow: "5",
    };

    for (var name in params) {
      var param = document.createElement("param");
      param.setAttribute("name", name);
      param.setAttribute("value", params[name]);
      player.appendChild(param);
    }

    this.oiplayer.figure.appendChild(player);
    return player;
  }

  static canPlay(media) {
    const sources = media.querySelectorAll("source");
    let proposal = {
      proposal: "cortado",
      canplay: "",
    };

    for (let index = 0; index < sources.length; index++) {
      const type = sources[index].type;
      if (
        type.indexOf("video/ogg") > -1 ||
        type.indexOf("audio/ogg") > -1 ||
        type.indexOf("application/ogg") > -1 ||
        type.indexOf("application/ogg") > -1
      ) {
        proposal = {
          ...proposal,
          canplay: "maybe",
          mimetype: type,
          url: sources[index].src,
        };

        break;
      }
    }

    return proposal;
  }

  play() {
    this.player.doPlay();
    this.state = "playing";
  }

  pause() {
    this.player.doPause();
    this.state = "paused";
  }

  seek(sec) {
    this.player.doSeek(sec / this.duration);
  }

  get position() {
    if (this.state !== "init") {
      this.pos = this.player.getPlayPosition();
      return this.pos;
    } else {
      return 0;
    }
  }
}

(function () {
  class Oplayer {
    constructor(media, config) {
      this.media = media;
      this.config = {
        server: "http://www.openimages.eu",
        jar: "/oiplayer/plugins/cortado-ovt-stripped-0.6.0.jar",
        flash: "/oiplayer/plugins/flowplayer-3.2.7.swf",
        ...config,
      };

      this.init();
    }

    init() {
      // hide default controls
      this.media.controls = false;

      const figure = document.createElement("figure");
      figure.classList.add("oiplayer");

      const ctrlsHtml = this.controlsHtml();
      const div = document.createElement("div");
      div.innerHTML = ctrlsHtml;
      div.classList.add("oipcontrols");

      this.media.replaceWith(figure);
      figure.appendChild(this.media);
      figure.appendChild(div);
      this.figure = figure;
      this.ocontrols = div;

      // select player
      console.log("init");
      const proposal = CortadoPlayer.canPlay(this.media);
      const conf = this.config;
      this.config = {
        ...conf,
        ...proposal,
      }
      console.log("PROPOSAL", proposal, this.config);

      this.player = new CortadoPlayer(this.media, this, this.config);

      this.handlers();
      this.events();
    }

    follow() {
      const followProgress = () => {
        const duration = this.player.length;
        if (!Number.isFinite(duration)) {
          console.log("no duration", duration);
          return;
        }

        this.updateProgress(duration, this.player.position);
        this.updateTime(duration, this.player.position);
        this.updatePlayButton(this.player.state);

        if (this.player.state === "playing") {
          requestAnimationFrame(followProgress);
        }
      };

      requestAnimationFrame(followProgress);
    }

    scrub(ev) {
      const duration = this.player.length;
      // console.log("scrub", duration);
      if (!Number.isFinite(duration)) {
        console.log("no duration", duration);
        return;
      }

      const rect = this.progressBack.getBoundingClientRect();
      const pos = (ev.pageX - rect.left) / this.progressBack.offsetWidth;
      console.log("scrub", ev.pageX, rect.left, this.progressBack.offsetWidth, pos);
      this.player.seek(pos * duration);
      this.follow();
    }

    updateMetadata(data) {
      const { duration } = data;
      console.log("updateMetadata", this.player.length, data);

      // update ui
      this.updateTime(duration, this.player.position);
    }

    /**
     * Update UI with time and time left.
     *
     * @param {number} duration total time in seconds
     * @param {number} [sec=0] player position or current time
     * @memberof Oplayer
     */
    updateTime(duration, sec = 0) {
      this.timeleft.innerText = this._totime(sec);
      this.time.innerText = this._totime(duration - sec);
    }

    updatePlayButton(state) {
      // console.log("updatePlayButton", state);
      if (state === "playing") {
        this.buttonPlay.setAttribute("data-button-play", "playing");
      } else {
        this.buttonPlay.setAttribute("data-button-play", "paused");
      }
    }

    /**
     * Update UI of the progress played bar.
     *
     * @param {*} duration total time in seconds
     * @param {number} [sec=0] player position
     * @memberof Oplayer
     */
    updateProgress(duration, sec = 0) {
      const width = Math.round((sec / duration) * 100);
      this.progressPlayed.style.width = `${width}%`;
      this.progressPush.style.width = `${width}%`;
    }

    handlers() {
      this.buttonPlay = this.ocontrols.querySelector("[data-button-play]");
      this.buttonScreen = this.ocontrols.querySelector("[data-button-screen]");
      this.buttonVolume = this.ocontrols.querySelector("[data-button-volume]");

      this.progressPush = this.ocontrols.querySelector("[data-progress='push']");
      this.progressPlayed = this.ocontrols.querySelector("[data-progress='played']");
      this.progressLoaded = this.ocontrols.querySelector("[data-progress='loaded']");
      this.progressBack = this.ocontrols.querySelector("[data-progress='back']");
      this.time = this.ocontrols.querySelector("[data-time]");
      this.timeleft = this.ocontrols.querySelector("[data-timeleft]");

      this.ocontrols.setAttribute("data-state", "visible");
    }

    play() {
      this.player.play();
      this.follow();
    }

    fullscreen() {
      if (!document?.fullscreenEnabled) {
        // fullscreen.style.display = "none";
        console.log("no fullscreen");
      }
      console.log("fullscreen");

      if (document.fullscreenElement !== null) {
        // The document is in fullscreen mode
        document.exitFullscreen();
      } else {
        // The document is not in fullscreen mode
        this.figure.requestFullscreen();
      }
    }

    volume() {
      console.log("volume", this.muted);
      this.player.volume();
      this.buttonVolume.setAttribute("data-button-volume", this.muted ? "muted" : "playing");
    }

    events() {
      this.buttonPlay.addEventListener("click", () => this.play());
      this.buttonScreen.addEventListener("click", () => this.fullscreen());
      this.buttonVolume.addEventListener("click", () => this.volume());
      this.progressBack.addEventListener("click", (ev) => this.scrub(ev));
    }

    controlsHtml() {
      const html = `<ul class="controls">
        <li class="play">
          <button data-button-play="none"><span>Play</span></button>
        </li>
        <li class="timeleft">
          <div data-timeleft="0">00:00</div>
        </li>
        <li class="progress">
          <div class="bar push" data-progress="push">
            <button class="pos"><span>Position</span></button>
          </div>
          <div data-progress="played" class="bar played"></div>
          <div data-progress="loaded" class="bar loaded"></div>
          <div data-progress="back" class="bar back"></div>
        </li>
        <li class="time">
          <div data-time="0">00:00</div>
        </li>
        <li class="screen">
          <button data-button-screen><span>Screen</span></button>
        </li>
        <li class="sound">
          <button data-button-volume=""><span>Volume</span></button>
        </li>
      </ul>`;

      return html;
    }

    /*
     * Returns time formatted as 00:00
     * @param pos Seconds
     */
    _totime(pos) {
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
    }
  }

  const elements = document.querySelectorAll(".testplayer");
  elements.forEach((elem) => {
    const media = elem.querySelectorAll("video, audio");
    media.forEach((mt) => new Oplayer(mt));
  });
})();
