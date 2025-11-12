import OIPlayer from "./oiplayer";

const docReady = (cb) => {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(cb, 1);
  } else {
    document.addEventListener("DOMContentLoaded", cb);
  }
};

docReady(() => {
  const testplayer = document.querySelector(".testplayer");
  const media = testplayer?.querySelectorAll("video, audio");
  media?.forEach((el) => new OIPlayer(el, { controls: "top" }));

  const myMedia = document.getElementById("my-media");
  if (myMedia) {
    new OIPlayer(myMedia);
  }
});
