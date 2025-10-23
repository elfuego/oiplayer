(function () {
  class OIPlayer {
    constructor(elem, config) {
      this.elem = elem;

      this.init();
    }

    init() {
      console.log("elem", this.urls, this.types);
      const player = this.selectPlayer();
      console.log('pl', player);
    }

    /*
     * Selects which player to use and returns a proposal.type and proposal.url.
     * Adapt this to change the prefered order, here the order is: video/audio, cortado, msie_cortado, flash.
     * @param el    video or audio element
     * @param types mimetype (and codec) attributes
     * @param urls  media links
     */
    selectPlayer() {
      var proposal = {};
      var probably = this.canPlayMedia(this.types, this.urls);
      if (probably !== undefined) {
        proposal.type = "media";
        proposal.url = probably;
        return proposal; // optimization
      }
      if (proposal.type === undefined) {
        probably = canPlayCortado(types, urls);
        if (
          probably !== undefined &&
          (supportMimetype("application/x-java-applet") ||
            navigator.javaEnabled())
        ) {
          if ($.browser.msie) {
            // Argh! A browser check!
            /* IE always reports true on navigator.javaEnabled(),
                          that's why we need to check for the java plugin IE style. 
                          It needs an element with id 'clientcaps' somewhere in the page. 
                      */
            var javaVersionIE = clientcaps.getComponentVersion(
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
      if (proposal.type === undefined) {
        var flash_url;
        for (var i = 0; i < types.length; i++) {
          if (
            types[i].indexOf("video/flv") > -1 ||
            types[i].indexOf("video/x-flv") > -1
          ) {
            proposal.url = urls[i];
            proposal.type = "flash";
            return proposal;
          }
        }
        for (var j = 0; j < types.length; j++) {
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
    }

    /*
     * Returns (first) url it expects to be able to play with html5 video- or audiotag based on mimetype.
     */
    canPlayMedia(types, urls) {
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
    }

    get sources() {
      const elems = this.elem.querySelectorAll("source");
      if (!elems) {
        elems[0] = this.elem.getAttribute("src");
      }
      console.log("init elem", elems);
      return elems;
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

      const div = document.createElement("div");
      const innerdiv = document.createElement("div");
      div.classList.add("oiplayer");
      innerdiv.classList.add("player");

      mt.replaceWith(div);
      innerdiv.appendChild(mt);
      div.appendChild(innerdiv);

      const player = new OIPlayer(mt);
      console.log("player", player);
    });
  });
})();
