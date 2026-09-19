(()=>{
const details=document.getElementById('gpsDetails');
window.resetGps=()=>{details.innerHTML='<h2>Where to next?</h2><p>Hover a world or building.</p>'};
window.showGpsStop=stop=>{details.innerHTML=`<h2>${stop.name}</h2><p>${stop.description}</p>${stop.url?link(stop.url,stop.label||'Visit','gps-link'):'<button class="gps-link" onclick="openDirectory()">Explore →</button>'}`;details.scrollTop=0};
document.getElementById('gpsOpen').onclick=openDirectory;
document.querySelectorAll('.island').forEach(island=>{const update=()=>{if(busy||current!=='hub')return;const key=island.dataset.go,w=CITIES[key];details.innerHTML=`<h2>${w.title}</h2><p>${WORLDS[key].subtitle}</p><button class="gps-link" data-go="${key}">Fly into this world →</button>`;details.scrollTop=0};island.addEventListener('pointerenter',update);island.addEventListener('focus',update)});
// The knob accepts dragging, keyboard arrows, and the labelled slider.
const knob=document.getElementById('volumeDial'),range=document.getElementById('volume');knob.setAttribute('role','slider');knob.setAttribute('tabindex','0');knob.setAttribute('aria-label','Volume');knob.setAttribute('aria-valuemin','0');knob.setAttribute('aria-valuemax','100');let drag=null;
function change(value){range.value=Math.max(0,Math.min(100,Math.round(value)));range.dispatchEvent(new Event('input',{bubbles:true}));knob.setAttribute('aria-valuenow',range.value)}
knob.addEventListener('pointerdown',e=>{e.preventDefault();drag={y:e.clientY,value:Number(range.value)};knob.setPointerCapture(e.pointerId)});knob.addEventListener('pointermove',e=>{if(drag)change(drag.value+(drag.y-e.clientY)*.7)});knob.addEventListener('pointerup',()=>drag=null);knob.addEventListener('pointercancel',()=>drag=null);knob.addEventListener('keydown',e=>{if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();change(e.key==='Home'?0:e.key==='End'?100:Number(range.value)+(e.key==='ArrowUp'||e.key==='ArrowRight'?5:-5))}});range.addEventListener('input',()=>knob.setAttribute('aria-valuenow',range.value));knob.setAttribute('aria-valuenow',range.value);
window.resetGps();
})();
