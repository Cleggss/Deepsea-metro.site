  function musictoggle() { /*javascript function for music toggle*/
    var audio = document.getElementById("audio"); /*defines the audio variable*/
    audio.volume = 0.6; /*sets audio volume*/
    if (audio.paused) audio.play();
    else audio.pause();
  } /*pauses it if its playing, plays it if its paused*/