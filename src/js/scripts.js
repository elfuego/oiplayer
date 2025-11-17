import OIPlayer from "./oiplayer";

const docReady = (cb) => {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(cb, 1);
  } else {
    document.addEventListener("DOMContentLoaded", cb);
  }
};

docReady(() => {
  const media = document.querySelectorAll("video, audio");
  media?.forEach((el) => new OIPlayer(el, { controls: `top` }));
});
