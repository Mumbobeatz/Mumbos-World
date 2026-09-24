(()=>{
 const hat=document.querySelector('.galaxy-art'),sign=document.querySelector('.hanging-sign'),dash=document.getElementById('cockpit'),portal=document.querySelector('.portal');
 function place(){
  if(document.body.dataset.scene!=='galaxy')return;
  // Layout dimensions exclude the temporary 7.5x return-flight transform.
  const signBottom=sign.offsetTop+sign.offsetHeight;
  const selector=document.getElementById('worldSelector');
  const dashTop=innerHeight-dash.offsetHeight+Math.min(0,selector?.offsetTop||0)-24;
  hat.style.removeProperty('width');
  const available=Math.max(0,dashTop-signBottom-32);
  const width=Math.min(hat.offsetWidth,available*1.5),center=(signBottom+dashTop)/2;
  hat.style.setProperty('width',width+'px','important');
  hat.style.setProperty('top',center+'px','important');hat.style.setProperty('bottom','auto','important');hat.style.setProperty('transform','translate(-50%,-50%)','important');
  portal.style.setProperty('left',(innerWidth/2-width*.0176)+'px','important');
  portal.style.setProperty('top',(center-width*.11327)+'px','important');
 }
 window.placeGalaxy=place;
 new ResizeObserver(place).observe(dash);new ResizeObserver(place).observe(sign);
 new MutationObserver(place).observe(document.body,{attributes:true,attributeFilter:['data-scene']});
 addEventListener('resize',place);addEventListener('load',place);place();
})();
