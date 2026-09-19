document.querySelectorAll(".linkbutton, .linkboxbutton, .occontainer, .btnwrapper, .dfl-download").forEach((el) => { //each element with classes specified
    el.addEventListener("mouseenter", () => { //"mouseenter" so it only triggers when initially hovering
      playSound("navhoversfx");
    });
    el.addEventListener("click", () => { //"click" should trigger when clicked, but impossible due to loading, kinda just there if ur device is slow lol
      playSound("navclicksfx");
    });
});

document.querySelectorAll(".flex4button, #chatheader a, footer a").forEach((el) => { //each element with .flex4button and links in the chatheader, and also the footer link
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("tophoversfx");
    });
    el.addEventListener("click", () => { //"click"
      playSound("navclicksfx");
    });
});

document.querySelectorAll(".inner a:not(.linkboxbutton):not(.occontainer):not(.socialssidebar a):not(#gallery_buttons a):not(.btnwrapper):not(#loreredirbutton)").forEach((el) => { //each a element (not just links! excludes specified elsewhere)
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("hoversfx");
    });
    el.addEventListener("click", () => { //"click"
      playSound("navclicksfx");
    });
}); 

document.querySelectorAll(".socialssidebar a, #gallery_buttons a, .dfl-button").forEach((el) => { //just the regular click sfx, for socials and carousel and lightbox button
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("hoversfx");
    });
    el.addEventListener("click", () => { //"click"
      playSound("clicksfx");
    });
});

document.querySelectorAll("#loreredirbutton").forEach((el) => { //loreredirbutton
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("tophoversfx");
    });
    el.addEventListener("click", () => { //"click"
      playSound("loreclicksfx");
    });
}); 

document.querySelectorAll(".sidebarchar").forEach((el) => { //extra stuff that would be nice with hover sfx
    el.addEventListener("mouseenter", () => { //"mouseenter"
      playSound("hoversfx");
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