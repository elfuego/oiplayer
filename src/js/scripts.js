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
  media?.forEach((el, i) => new OIPlayer(el, { controls: `top ${i % 2 !== 0 ? "dark" : ""}` }));
});
