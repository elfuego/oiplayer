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

    this.poster = this.media.getAttribute("poster");
    this.autoplay = this.media.getAttribute("autoplay");
    if (!this.autoplay) this.autoplay = false;
    this.autobuffer = this.media.getAttribute("autobuffer");
    if (!this.autobuffer) this.autobuffer = false;
    // this.controls = this.media.getAttribute("controls") || false;
    if (this.type == "audio") {
      this.el.removeAttribute("width");
      this.el.removeAttribute("height");
    }
  }

  get height() {
    const default_height = this.type === "audio" ? 32 : 288;
    return parseInt(this.media.getAttribute("height")) || default_height;
  }

  get width() {
    return parseInt(this.media.getAttribute("width")) || 512;
  }

  get duration() {
    return -1;
  }

  get position() {
    return -1;
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
    console.log("mediaplayer", this.type);
  }

  eventHandlers() {
    this.media.addEventListener("loadedmetadata", () => {
      console.log("duration", this.myname, this.media.duration);
      // if (!progress.getAttribute("max")) progress.setAttribute("max", this.media.duration);
    });

    this.media.addEventListener("timeupdate", () => {
      // console.log("timeupdate", this.media.duration);
      // if (!progress.getAttribute("max")) progress.setAttribute("max", this.media.duration);
    });

    this.media.addEventListener("ended", () => (this.state = "ended"));
    this.media.addEventListener("playing", () => (this.state = "playing"));
    this.media.addEventListener("paused", () => (this.state = "paused"));
    this.media.addEventListener("canplaythrough", () => (this.state = "canplaythrough"));
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

  get duration() {
    return this.media.duration || -1;
  }

  get position() {
    return this.media.currentTime || -1;
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

      controls.appendChild(button);
      controls.appendChild(progress);

      this.media.replaceWith(figure);
      figure.appendChild(this.media);
      figure.appendChild(controls);
      this.ocontrols = controls;

      this.playerInfo();
      this.player = new MediaPlayer(this.media, this);

      this.handlers();
      this.events();

      console.log("STATE", this.player.state);
    }

    follow() {
      const followProgress = () => {
        const duration = this.player.duration;
        if (!duration) {
          console.log("no duration");
          return;
        }

        this.progress.value = this.player.position;
        if (this.player.state === "playing") {
          requestAnimationFrame(followProgress);
        }
      };

      requestAnimationFrame(followProgress);
    }

    scrub(ev) {
      const duration = this.player.duration;
      console.log("srub", duration);
      if (!duration) {
        console.log("no duration");
        return;
      }

      const rect = this.progress.getBoundingClientRect();
      const pos = (ev.pageX - rect.left) / this.progress.offsetWidth;
      this.progress.value = pos * duration;
      this.media.currentTime = pos * duration;
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
A string specifying the MIME type of the media and (optionally) a codecs parameter containing a comma-separated list of the supported codecs.

Return value
A string indicating how likely it is that the media can be played. The string will be one of the following values:

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
      this.progress.max = this.player.duration;

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
  }

  const elements = document.querySelectorAll(".testplayer");
  elements.forEach((elem) => {
    const media = elem.querySelectorAll("video, audio");
    media.forEach((mt) => new Oplayer(mt));
  });
})();
