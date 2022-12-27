
// popup-image

function Fullview(imgsrc){
  document.getElementById('FullscreenImg').src = imgsrc;
  document.getElementById('FullscreenPopup').style.display = 'block';
}

function CloseFullscreen(){
  document.getElementById('FullscreenPopup').style.display = 'none';
}

function Hide(){
  document.getElementById('hideme').style.display = 'none';
}