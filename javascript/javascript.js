
// popup-image

function Fullview(imgsrc){
  alert(imgsrc);
  document.getElementById('overlayimg').src = imgsrc;
  document.getElementById('overlay').style.display = 'block';
}

function CloseFullView(){
  document.getElementById('overlay').style.display = 'none';
}
