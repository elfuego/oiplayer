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
    this.bufferedSeconds = 0;

    this.poster = this.media.getAttribute("poster");
  }

  get height() {
    const default_height = this.type === "audio" ? 48 : 288;
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
    this.media.addEventListener("progress", () => {
      const duration = this.media.duration;
      if (duration > 0) {
        for (let i = 0; i < this.media.buffered.length; i++) {
          if (this.media.buffered.start(this.media.buffered.length - 1 - i) < this.media.currentTime) {
            this.bufferedSeconds = this.media.buffered.end(this.media.buffered.length - 1 - i);
            break;
          }
        }
      }
    });

    this.media.addEventListener("playing", () => (this.state = "playing"));
    this.media.addEventListener("paused", () => (this.state = "paused"));
    this.media.addEventListener("ended", () => (this.state = "ended"));
  }

  metadataLoaded() {
    const duration = this.media.duration;
    // console.log("updateMetadata", this.updatedMetadata, duration);
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

(function () {
  class OIPlayer {
    constructor(media, config) {
      this.id = media.id || "id" + Math.random().toString(16).slice(2);
      this.media = media;
      this.config = {
        server: "http://www.openimages.eu",
        controls: "top",
        ...config,
      };

      this.init();
    }

    init() {
      // hide default controls
      this.media.controls = false;

      const figure = document.createElement("figure");
      figure.classList.add("oiplayer");
      this.media.replaceWith(figure);
      figure.appendChild(this.media);
      this.figure = figure;

      // select player
      const proposal = MediaPlayer.canPlay(this.media);
      const conf = this.config;
      this.config = {
        ...conf,
        ...proposal,
      };
      console.log("PROPOSAL", proposal, this.config);

      this.player = new MediaPlayer(this.media, this, this.config);

      this.oipAttributes();
      this.makeUI();
      this.handlers();
      this.events();
    }

    makeUI() {
      this.figure.classList.add(this.player.type);

      const ctrlsHtml = this.controlsHtml();
      const div = document.createElement("div");

      div.innerHTML = ctrlsHtml;
      div.classList.add("oipcontrols");
      this.figure.appendChild(div);
      this.oipcontrols = div;

      if (this.controlsDark) {
        this.figure.classList.add("dark");
      }

      if (this.controlsTop) {
        this.figure.classList.add("top");
      }

      const preview = this.previewImage();
      if (preview) {
        this.figure.appendChild(preview);
        this.previewScreen = preview;
      }

      this.updateUIDimensions(this.player.height, this.player.width);
    }

    /**
     * Sets height and width as css var's of `figure.oiplayer` based
     * on sizes of video player, default audio player size or its included image.
     *
     * @param {number} height in pixels
     * @param {number} width in pixels
     * @memberof OIPlayer
     */
    updateUIDimensions(height, width) {
      let newHeight = this.controlsTop ? height : height + 48;
      let newWidth = width;

      if (this.player.type === "audio") {
        const he = this.previewScreen.getAttribute("height");
        const wi = this.previewScreen.getAttribute("width");

        newHeight = this.controlsTop ? Number(he) : Number(he) + 48;
        newWidth = Number(wi);
        console.log("AUDIO", he, wi, height, newHeight);
      }

      this.figure.style.setProperty("--oiplayer-height", `${newHeight}px`);
      this.figure.style.setProperty("--oiplayer-width", `${newWidth}px`);
    }

    handlers() {
      this.buttonPlay = this.oipcontrols.querySelector("[data-button-play]");
      this.buttonScreen = this.oipcontrols.querySelector("[data-button-screen]");
      this.buttonVolume = this.oipcontrols.querySelector("[data-button-volume]");

      this.progressPush = this.oipcontrols.querySelector("[data-progress='push']");
      this.progressPlayed = this.oipcontrols.querySelector("[data-progress='played']");
      this.progressLoaded = this.oipcontrols.querySelector("[data-progress='loaded']");
      this.progressBack = this.oipcontrols.querySelector("[data-progress='back']");
      this.time = this.oipcontrols.querySelector("[data-time]");
      this.timeleft = this.oipcontrols.querySelector("[data-timeleft]");

      this.previewScreen = this.figure.querySelector("[data-preview]");
    }

    events() {
      this.buttonPlay.addEventListener("click", () => this.play());
      this.buttonScreen.addEventListener("click", () => this.fullscreen());
      this.buttonVolume.addEventListener("click", () => this.volume());
      this.progressBack.addEventListener("click", (ev) => this.scrub(ev));

      if (this.controlsTop) {
        this.figure.addEventListener("mouseover", () => this.showControls(true));
        this.figure.addEventListener("mouseout", () => this.showControls(false));
        this.showControls(true);
      }

      this.previewScreen?.addEventListener("click", () => this.play());
    }

    follow() {
      const followProgress = () => {
        let duration = this.player.length;
        if (!Number.isFinite(duration)) {
          // console.log("no duration", duration);
          if (this.duration) {
            duration = this.duration;
          }
          if (!duration) {
            console.log("no duration", duration);
            return;
          }
        }

        // console.log("follow", duration, this.player.position, this.player.state);
        this.updateProgress(duration, this.player.position);
        this.updateTime(duration, this.player.position);
        this.updatePlayButton(this.player.state);
        this.updateLoaded(duration);

        if (this.player.state === "playing") {
          requestAnimationFrame(followProgress);
        }
      };

      requestAnimationFrame(followProgress);

      // and make sure this is hidden
      this.hidePreviewImage();
    }

    scrub(ev) {
      let duration = this.player.length;
      if (!Number.isFinite(duration)) {
        // console.log("no duration", duration);
        if (this.duration) {
          duration = this.duration;
        }
        if (!duration) {
          console.log("no duration", duration);
          return;
        }
      }

      const rect = this.progressBack.getBoundingClientRect();
      const pos = (ev.pageX - rect.left) / this.progressBack.offsetWidth;
      console.log("scrub", ev.pageX, rect.left, this.progressBack.offsetWidth, pos);
      this.player.seek(pos * duration);
      this.follow();
    }

    /**
     * Handles extra attributes added by Open Images site to help player.
     *
     * @memberof OIPlayer
     */
    oipAttributes() {
      const attributes = this._extraAttributes(this.media);
      for (let i = 0; i < attributes.length; i++) {
        const param = attributes[i];
        if (param.name === "duration") {
          this.duration = Number(param.value);
        } else if (param.name === "id") {
          this.id = `id-${param.value}`;
        } else if (param.name === "start") {
          this.start = Number(param.value);
        }
      }

      // console.log("extra", this.duration, this.id, this.start);
    }

    updateMetadata(data) {
      const { duration, height, width } = data;
      // console.log("updateMetadata", data);

      // update ui
      this.updateTime(duration, this.player.position);
      this.updateLoaded(duration);
    }

    /**
     * Update UI with time and time left.
     *
     * @param {number} duration total time in seconds
     * @param {number} [sec=0] player position or current time
     * @memberof OIPlayer
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
     * @memberof OIPlayer
     */
    updateProgress(duration, sec = 0) {
      const width = Math.round((sec / duration) * 100);
      this.progressPlayed.style.width = `${width}%`;
      this.progressPush.style.width = `${width}%`;
    }

    /**
     * Seconds loaded from player.
     *
     * @param {*} duration
     * @memberof OIPlayer
     */
    updateLoaded(duration) {
      const sec = this.player.bufferedSeconds;
      if (sec < 1) {
        return;
      }

      const width = Math.round((sec / duration) * 100);
      this.progressLoaded.style.width = `${width}%`;
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

      if (document.fullscreenElement !== null) {
        // The document is in fullscreen mode
        document.exitFullscreen();
      } else {
        // The document is not in fullscreen mode
        this.figure.requestFullscreen();
      }
    }

    volume() {
      // console.log("volume", this.muted);
      this.player.volume();
      this.buttonVolume.setAttribute("data-button-volume", this.muted ? "muted" : "playing");
    }

    showControls(show) {
      if (show) {
        this.oipcontrols.setAttribute("data-show", "show");
      } else if (this.player.state !== "init") {
        this.oipcontrols.setAttribute("data-show", "hidden");
      }
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

    /**
     * Creates an overlaying preview of the video from it's poster, or from an included
     * image within the media tag, for example for an audio "preview". If an img tag is
     * found it uses it as its poster, else it creates an image tag from attribute poster.
     *
     * @returns img element
     * @memberof OIPlayer
     */
    previewImage() {
      const img = this.media.querySelector("img");
      if (img) {
        img.setAttribute("data-preview", "shown");
        img.classList.add("preview");
        return img;
      }

      const poster = this.media.getAttribute("poster");
      if (!poster) {
        return;
      }

      const image = document.createElement("img");
      image.src = poster;
      image.width = this.width;
      image.height = this.height;
      image.setAttribute("data-preview", "shown");
      image.classList.add("preview");

      return image;
    }

    /**
     * Hide preview, not for audio if we have one.
     */
    hidePreviewImage() {
      if (this.player.type === "video" && this.previewScreen?.getAttribute("data-preview") === "shown") {
        this.previewScreen.setAttribute("data-preview", "hidden");
      }
    }

    /*
     * Returns attributes and values hidden in classes of an element, f.e. oip_ea_attr_value
     */
    _extraAttributes(el) {
      const attrs = el.getAttribute("class");
      const result = [];
      if (attrs) {
        const classes = attrs.split(" ");
        for (let i = 0; i < classes.length; i++) {
          const clz = classes[i];
          if (clz.indexOf("oip_ea") > -1) {
            const param = clz.substring("oip_ea_".length);
            const name = param.substring(0, param.indexOf("_"));
            const value = param.substring(param.indexOf("_") + 1);
            result.push({ name, value });
          }
        }
      }

      return result;
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

    get controlsDark() {
      return this.config.controls.indexOf("dark") > -1;
    }

    get controlsTop() {
      return this.config.controls.indexOf("top") > -1;
    }
  }

  const youth = document.getElementById("sonic-youth");
  if (youth) {
    new OIPlayer(youth, { controls: "dark" });
  }

  const elements = document.querySelectorAll(".testplayer");
  elements.forEach((elem) => {
    const media = elem.querySelectorAll("video, audio");
    media.forEach((mt) => new OIPlayer(mt, { controls: "top" }));
  });

  const audio = document.getElementById("my-audio");
  if (audio) {
    new OIPlayer(audio, { controls: "top" });
  }
})();
