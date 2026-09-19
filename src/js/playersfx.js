document.querySelectorAll(".controlbutton, .slider").forEach((el) => { //just the regular click sfx, for socials and carousel
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("hoversfx");
    });
    el.addEventListener("click", () => { //"click"
      playSound("clicksfx");
    });
});


function playSound(soundName) {
  const audio = document.querySelector("#" + soundName);
  if (!audio) return;

  // removed audio.muted = false since it interferes with the toggle, yayy
  audio.volume = 0.25; // change volume here, e.g. 0.5 CLEGGSADD:: was originally quieter on only this page but it fit better for the rest of the site tbh

  if (audio.readyState < 4 || !audio.duration) {
    audio.load();
    audio.addEventListener(
      "canplaythrough",
      () => {
        audio
          .play()
          .catch((err) =>
            console.error("Playback of " + soundName + " failed:", err),
          );
      },
      { once: true },
    );
  } else {
    audio
      .play()
      .catch((err) =>
        console.error("Playback of " + soundName + " failed:", err),
      );
  }
}