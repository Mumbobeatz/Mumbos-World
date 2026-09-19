(()=>{
Object.values(CITIES).forEach(city=>{const image=new Image();image.src=`assets/${city.image}.webp`});
const sun=document.querySelector('.central-star');let sunMood=0,sunTimer;
function lookAt(x,y){if(paused)return;const r=sun.getBoundingClientRect();sun.querySelectorAll('.sun-gaze i').forEach((eye,index)=>{const ex=r.left+r.width*(index?.6713:.3667),ey=r.top+r.height*(index?.4351:.4448),dx=x-ex,dy=y-ey,angle=Math.atan2(dy,dx),strength=Math.min(1,Math.hypot(dx,dy)/(r.width*.8)),rx=r.width*.068,ry=r.height*.067;eye.style.transform=`translate(calc(-50% + ${Math.cos(angle)*rx*strength}px),calc(-50% + ${Math.sin(angle)*ry*strength}px))`})}
document.addEventListener('pointermove',e=>lookAt(e.clientX,e.clientY));
sun.addEventListener('click',()=>{clearTimeout(sunTimer);sunMood=sunMood===1?2:1;sun.dataset.mood=sunMood===1?'laugh':'angry';sun.setAttribute('aria-label',sunMood===1?'The sun is laughing. Click for another expression.':'The sun is angry. Click for another expression.');sunTimer=setTimeout(()=>{sun.dataset.mood='neutral';sun.setAttribute('aria-label','Play with the sun')},2800)});
// Commuters follow shared lanes between the actual world positions.
const traffic=document.querySelector('.space-traffic');traffic.innerHTML='';const lanePairs=[];
const routes=[[[24,29],[69,23]],[[24,29],[24,73]],[[69,23],[76,73]],[[24,73],[91,28]],[[91,28],[76,73]],[[24,29],[91,28]],[[69,23],[91,28]]];
routes.forEach(([a,b],route)=>{const lane=document.createElement('i');lane.className='commute-lane';const dx=b[0]-a[0],dy=b[1]-a[1];lane.style.cssText=`left:${a[0]}%;top:${a[1]}%;width:${Math.hypot(dx,dy)}%;--lane-angle:${Math.atan2(dy,dx)*180/Math.PI}deg`;traffic.append(lane);lanePairs.push({lane,a,b});for(let n=0;n<12;n++){const traveler=document.createElement('i');traveler.className='commuter '+(n%3===0?'walker':n%2?'jet':'ship');traveler.style.cssText=`--ax:${a[0]}%;--ay:${a[1]}%;--bx:${b[0]}%;--by:${b[1]}%;--duration:${17+route*3+n*2}s;--delay:-${route*5+n*7}s;--direction:${n%2?'reverse':'normal'}`;traffic.append(traveler)}});
function alignLanes(){const r=traffic.getBoundingClientRect();if(!r.width)return;lanePairs.forEach(({lane,a,b})=>{const dx=(b[0]-a[0])*r.width/100,dy=(b[1]-a[1])*r.height/100;lane.style.width=Math.hypot(dx,dy)+'px';lane.style.setProperty('--lane-angle',Math.atan2(dy,dx)*180/Math.PI+'deg')})}
new ResizeObserver(alignLanes).observe(traffic);alignLanes();
})();
