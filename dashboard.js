(()=>{
 const details=document.getElementById('gpsDetails'),selector=document.getElementById('worldSelector'),reelWorld=document.getElementById('reelWorld');
 const keys=['music','media','about','events','toys'];
 const labels={music:'Music Island',media:'Media Center',about:'Mumbo’s Moon',events:'Event Central',toys:'Mumbo’s Playground'};
 let selected=0,dragStart=null,wheelTotal=0,lastWheelAt=0;
 const topWorld=name=>SUBWORLDS[name]?'music':keys.includes(name)?name:null;
 function showWorldInfo(key){details.innerHTML=`<p class="world-description">${WORLD_INFO[key]}</p>`}
 function render(key=keys[selected],animate=true,showInfo=true){
  selected=Math.max(0,keys.indexOf(key));const next=labels[keys[selected]],changed=reelWorld.textContent!==next;
  reelWorld.textContent=next;
  document.getElementById('reelPrevious').textContent=labels[keys[(selected+keys.length-1)%keys.length]];
  document.getElementById('reelNext').textContent=labels[keys[(selected+1)%keys.length]];
  selector.dataset.world=keys[selected];
  if(changed&&animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   reelWorld.animate?.([{transform:'rotateX(-65deg) translateY(14px)',opacity:.25},{transform:'rotateX(0) translateY(0)',opacity:1}],{duration:240,easing:'ease-out'});
  }
  if(showInfo)showWorldInfo(keys[selected]);
 }
 function rotate(step){selected=(selected+step+keys.length)%keys.length;render()}
 function enter(){const key=keys[selected];if(current!==key){const origin=current==='hub'?document.querySelector(`.island[data-go="${key}"]`):selector;travel(key,origin)}}
 document.getElementById('reelUp').addEventListener('click',()=>rotate(-1));
 document.getElementById('reelDown').addEventListener('click',()=>rotate(1));
 document.getElementById('reelEnter').addEventListener('click',enter);
 const wheel=selector.querySelector('.reel-window');
 wheel.addEventListener('pointerdown',e=>{dragStart=e.clientY;wheel.setPointerCapture(e.pointerId);wheel.classList.add('dragging')});
 wheel.addEventListener('pointermove',e=>{if(dragStart===null)return;const dy=e.clientY-dragStart;if(Math.abs(dy)>=24){rotate(dy>0?-1:1);dragStart=e.clientY}});
 const endDrag=()=>{dragStart=null;wheel.classList.remove('dragging')};wheel.addEventListener('pointerup',endDrag);wheel.addEventListener('pointercancel',endDrag);
 selector.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();const now=performance.now();if(now-lastWheelAt<180)return;wheelTotal+=e.deltaY;if(Math.abs(wheelTotal)>=24){rotate(wheelTotal>0?1:-1);wheelTotal=0;lastWheelAt=now}},{passive:false});
 selector.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();rotate(-1)}if(e.key==='ArrowDown'){e.preventDefault();rotate(1)}if(e.key==='Enter'&&!e.target.closest('button')){e.preventDefault();enter()}});
 window.resetGps=()=>{if(SUBWORLDS[current]){details.innerHTML=`<p class="world-description">${SUBWORLDS[current].info}</p>`;return}showWorldInfo(topWorld(current)||keys[selected])};
 window.showGpsStop=stop=>{details.innerHTML=`<h2>${stop.name}</h2><p>${stop.kind}</p>`};
 window.syncWorldSelector=name=>{const key=topWorld(name)||keys[selected];render(key,false,false);window.resetGps()};
 document.getElementById('gpsOpen').onclick=openDirectory;
 document.querySelectorAll('.island').forEach(island=>{const update=()=>{if(busy||current!=='hub')return;const key=island.dataset.go;if(keys.includes(key))render(key)};island.addEventListener('pointerenter',update);island.addEventListener('focus',update)});
 const knob=document.getElementById('volumeDial'),range=document.getElementById('volume');knob.setAttribute('role','slider');knob.setAttribute('tabindex','0');knob.setAttribute('aria-label','Volume');knob.setAttribute('aria-valuemin','0');knob.setAttribute('aria-valuemax','100');let drag=null;
 function change(value){range.value=Math.max(0,Math.min(100,Math.round(value)));range.dispatchEvent(new Event('input',{bubbles:true}));knob.setAttribute('aria-valuenow',range.value)}
 knob.addEventListener('pointerdown',e=>{e.preventDefault();drag={y:e.clientY,value:Number(range.value)};knob.setPointerCapture(e.pointerId)});knob.addEventListener('pointermove',e=>{if(drag)change(drag.value+(drag.y-e.clientY)*.7)});knob.addEventListener('pointerup',()=>drag=null);knob.addEventListener('pointercancel',()=>drag=null);knob.addEventListener('keydown',e=>{if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();change(e.key==='Home'?0:e.key==='End'?100:Number(range.value)+(e.key==='ArrowUp'||e.key==='ArrowRight'?5:-5))}});range.addEventListener('input',()=>knob.setAttribute('aria-valuenow',range.value));knob.setAttribute('aria-valuenow',range.value);window.syncWorldSelector(current);
})();
