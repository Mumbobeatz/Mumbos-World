(()=>{
 const hat=document.querySelector('.galaxy-art'),sign=document.querySelector('.hanging-sign'),dash=document.getElementById('cockpit'),portal=document.querySelector('.portal');
 function place(){
  if(document.body.dataset.scene!=='galaxy')return;
  // Layout dimensions exclude the temporary 7.5x return-flight transform.
  const signBottom=sign.offsetTop+sign.offsetHeight,dashTop=innerHeight-dash.offsetHeight;
  const center=(signBottom+dashTop)/2,width=hat.offsetWidth;
  hat.style.setProperty('top',center+'px','important');hat.style.setProperty('bottom','auto','important');hat.style.setProperty('transform','translate(-50%,-50%)','important');
  portal.style.setProperty('top',(center-width*.11327)+'px','important');
 }
 window.placeGalaxy=place;
 new ResizeObserver(place).observe(dash);new ResizeObserver(place).observe(sign);
 new MutationObserver(place).observe(document.body,{attributes:true,attributeFilter:['data-scene']});
 addEventListener('resize',place);addEventListener('load',place);place();
})();
