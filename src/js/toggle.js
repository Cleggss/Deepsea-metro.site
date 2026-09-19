if(localStorage.getItem('SFX') == '0'){ // SFX == only enables if the button is clicked (if SFX = 0)
  $("#sfxtogglebutton").toggleClass("buttonclicked");
  $("#sfxtogglebuttonimg").attr("src", "/images/cqstyle/sfxmutebutton.png");
  $("audio").prop("muted", true);
}

if(localStorage.getItem('scanlines') == '0'){ // SCANLINES == only enables if the button is clicked (if scanlines = 0)
  $("#crt-filter").toggleClass("hidden");
  $("#scanlinetogglebutton").toggleClass("buttonclicked");
}

$("#scanlinetogglebutton").click(function(){
    if(localStorage.getItem('scanlines') == '0') { // if the button is clicked already
        $("#crt-filter").toggleClass("hidden"); // toggles hidden class
        $("#scanlinetogglebutton").toggleClass("buttonclicked"); // toggles button clicked class
        localStorage.setItem('scanlines', '1'); // set scanlines to 1 (setting to not 0, 1 doesn't really do anything specific)
    } else { // otherwise, if it hasn't been
        $("#crt-filter").toggleClass("hidden");
        $("#scanlinetogglebutton").toggleClass("buttonclicked");
        localStorage.setItem('scanlines', '0'); // set scanlines to 0 (next click will set back to 1)
    }
});

$("#sfxtogglebutton").click(function(){
    if(localStorage.getItem('SFX') == '0') {
        $("#sfxtogglebutton").toggleClass("buttonclicked");
        $("#sfxtogglebuttonimg").attr("src", "/images/cqstyle/sfxplaybutton.png");
        $("audio").prop("muted", false);
        localStorage.setItem('SFX', '1');
    } else {
        $("#sfxtogglebutton").toggleClass("buttonclicked");
        $("#sfxtogglebuttonimg").attr("src", "/images/cqstyle/sfxmutebutton.png");
        $("audio").prop("muted", true);
        localStorage.setItem('SFX', '0');
    }
});