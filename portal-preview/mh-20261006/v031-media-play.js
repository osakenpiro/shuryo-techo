
(() => {
  const media=document.querySelector(".asc-main-media");
  const button=media.querySelector(".asc-play");
  button.addEventListener("click",()=>{
    const frame=document.createElement("iframe");
    frame.title="Monster Hunter Wilds: Ascendance - Official 1st Trailer";
    frame.src="https://www.youtube.com/embed/ZeMKYURp_A8?rel=0&autoplay=1";
    frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.allow="autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen=true;
    media.appendChild(frame);
    media.dataset.playback="requested";
    button.hidden=true;
    frame.focus();
  },{once:true});
})();
