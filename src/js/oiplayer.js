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
    // this.url = config.url;

    this.duration = -1;

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

  get length() {
    return 0;
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
      console.log("loadedmetadata", this.media.duration);
      this.metadataUpdate();
    });

    this.media.addEventListener("timeupdate", () => {
      if (this.duration < 0) {
        // on some (mobile) browsers 'loadedmetadata' does not succeed in a correct value
        console.log("timeupdate duration", this.media.duration);
        this.metadataUpdate();
      }
    });

    this.media.addEventListener("ended", () => (this.state = "ended"));
    this.media.addEventListener("playing", () => (this.state = "playing"));
    this.media.addEventListener("paused", () => (this.state = "paused"));
    this.media.addEventListener("canplaythrough", () => (this.state = "canplaythrough"));
  }

  metadataUpdate() {
    this.duration = this.media.duration;

    const meta = {
      duration: this.media.duration,
      height: this.media.videoHeight ? this.media.videoHeight : -1,
      width: this.media.videoWidth ? this.media.videoWidth : -1,
    };

    this.oiplayer.updateMetaData(meta);
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

  get length() {
    return this.media.duration;
  }

  get position() {
    return this.media.currentTime;
  }
}

(function () {
  class Oplayer {
    constructor(media, config) {
      this.media = media;
      this.config = config;

      this.init();
    }

    init() {
      // hide default controls
      this.media.controls = false;

      const figure = document.createElement("div");
      figure.classList.add("oiplayer");

      const controls = document.createElement("div");
      controls.classList.add("controls");

      const button = document.createElement("button");
      button.classList.add("play");
      button.setAttribute("data-button-play", "paused");
      button.innerText = "Play";

      const progress = document.createElement("progress");
      progress.classList.add("progress");
      progress.setAttribute("data-progress", "");
      progress.value = 0;

      const time = document.createElement("div");
      time.classList.add("time");
      time.setAttribute("data-time", "0:00");

      const yaHtml = this.controlsHtml();
      const divHtml = yaHtml;
      const yadiv = document.createElement("div");
      yadiv.innerHTML = divHtml;

      controls.appendChild(button);
      controls.appendChild(progress);
      controls.appendChild(time);
      controls.appendChild(yadiv);

      this.media.replaceWith(figure);
      figure.appendChild(this.media);
      figure.appendChild(controls);
      this.ocontrols = controls;

      // this.playerInfo();
      this.player = new MediaPlayer(this.media, this);

      this.handlers();
      this.events();

      console.log("STATE", this.player.state, this.player.duration);
    }

    follow() {
      const followProgress = () => {
        const duration = this.player.length;
        if (duration < 0) {
          console.log("no duration", duration);
          return;
        }

        this.progress.value = this.player.position;
        this.updateTime();

        if (this.player.state === "playing") {
          requestAnimationFrame(followProgress);
        }
      };

      requestAnimationFrame(followProgress);
    }

    scrub(ev) {
      const duration = this.player.length;
      console.log("scrub", duration);
      if (duration < 0) {
        console.log("no duration", duration);
        return;
      }

      const rect = this.progress.getBoundingClientRect();
      const pos = (ev.pageX - rect.left) / this.progress.offsetWidth;
      this.progress.value = pos * duration;
      this.player.seek(pos * duration);
    }

    updateMetaData(data) {
      const { duration } = data;
      console.log("updateMetaData", this.player.length, duration, data);

      // update ui
      this.progress.max = duration;
      this.time.innerText = this._totime(duration);
    }

    updateTime() {
      this.time.innerText = this._totime(this.player.position);
      // this.timeleft.innerText = this._totime(this.player.position - this.player.duration);
    }

    playerInfo() {
      const sources = this.media.querySelectorAll("source");
      let canPlay = false;
      sources.forEach((src) => {
        // const mtype = src.getAttribute('type');
        // console.log("info src", src.type, this.media.canPlayType(src.type));
        if (this.media.canPlayType(src.type)) {
          canPlay = true;
        }
      });

      return canPlay;
      /* type
"" (empty string)
The media cannot be played on the current device.

probably
The media is probably playable on this device.

maybe
There is not enough information to determine whether the media can play (until playback is actually attempted). */
      // console.log("canplaytype", canPlay);
    }

    handlers() {
      this.button = this.ocontrols.querySelector("[data-button-play]");
      this.progress = this.ocontrols.querySelector("[data-progress]");
      this.time = this.ocontrols.querySelector("[data-time]");

      this.ocontrols.setAttribute("data-state", "visible");
    }

    play() {
      this.player.play();
      this.follow();
    }

    events() {
      this.button.addEventListener("click", (ev) => this.play(ev));
      this.progress.addEventListener("click", (ev) => this.scrub(ev));
    }

    controlsHtml() {
      const html = `<ul class="controls">
          <li><div data-controls-time class="time">0:00</div></li>
          <li><button data-controls-button-play>Play</button></li>
          <li><progress data-controls-progress max="0" value="0" /></li>
          <li><div data-controls-timeleft class="timeleft">0:00</div></li>
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
