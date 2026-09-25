(()=>{
 const hat=document.querySelector('.galaxy-art'),sign=document.querySelector('.hanging-sign'),dash=document.getElementById('cockpit'),portal=document.querySelector('.portal');
 function place(){
  if(document.body.dataset.scene!=='galaxy')return;
  // Layout dimensions exclude the temporary 7.5x return-flight transform.
  const signBottom=sign.offsetTop+sign.offsetHeight;
  const selector=document.getElementById('worldSelector');
  const dashTop=innerHeight-dash.offsetHeight+Math.min(0,selector?.offsetTop||0)-14;
  hat.style.removeProperty('width');
  // Grow the current hat by 15%, bounded by the sign and dashboard.
  const mobile=innerWidth<=700;
  const previousSignWidth=mobile?innerWidth*.7656:Math.min(442.2,innerWidth*.4488);
  const previousSignBottom=innerHeight*.06+previousSignWidth*.5;
  const previousDashTop=innerHeight-dash.offsetHeight-(mobile?63:76)-24;
  const previousWidth=Math.min(hat.offsetWidth,Math.max(0,previousDashTop-previousSignBottom-32)*1.5);
  const available=Math.max(0,dashTop-signBottom-24);
  const width=Math.max(0,Math.min(previousWidth*1.3*1.15,available*1.7,innerWidth*.96)),center=(signBottom+dashTop)/2;
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
