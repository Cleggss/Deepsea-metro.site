document.querySelectorAll("a:not(.flex4button)").forEach((el) => { //each element with classes specified
    el.addEventListener("mouseenter", () => { //"mouseenter" so it only triggers when initially hovering
      playSound("hoversfx");
    });
    el.addEventListener("click", () => { //"click" should trigger when clicked, but impossible due to loading, kinda just there if ur device is slow lol
      playSound("clicksfx");
    });
});

document.querySelectorAll(".buttonspane").forEach((el) => { //extra buttons area
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("navhoversfx");
    });
});

document.querySelectorAll(".flex4button").forEach((el) => { //each .flex4button
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("tophoversfx");
    });
    el.addEventListener("click", () => { //"click"
      playSound("navclicksfx");
    });
});

function playSound(soundName) {
  const audio = document.querySelector("#" + soundName);
  if (!audio) return;

  // removed audio.muted = false since it interferes with the toggle, yayy
  audio.volume = 0.25; // change volume here, e.g. 0.5

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