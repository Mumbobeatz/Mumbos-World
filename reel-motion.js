/* Five labels travel as one strip. The center label remains available to screen readers. */
(()=>{
 if(CITIES.media){CITIES.media.image='media-ocean-v1';if(current==='media')document.getElementById('cityArt').src='assets/media-ocean-v1.webp'}
 const names=['music','media','about','events','toys'];
 const selector=document.getElementById('worldSelector');
 const windowEl=selector.querySelector('.reel-window');
 const currentEl=document.getElementById('reelWorld');
 const previousEl=document.getElementById('reelPrevious');
 const nextEl=document.getElementById('reelNext');
 const strip=document.createElement('div');
 strip.className='reel-strip';strip.setAttribute('aria-hidden','true');windowEl.append(strip);
 const wrap=n=>(n+names.length)%names.length;
 const title=name=>WORLDS[name].title;
 let index=Math.max(0,names.indexOf(current)),rolling=false,timer=0,pointerY=null;
 function labels(at){return [-2,-1,0,1,2].map(offset=>names[wrap(at+offset)])}
 function render(){
  const selected=names[index];
  selector.dataset.world=selected;
  previousEl.textContent=title(names[wrap(index-1)]);
  currentEl.textContent=title(selected);
  nextEl.textContent=title(names[wrap(index+1)]);
  strip.classList.remove('rolling','rolling-down','rolling-up');strip.style.transform='translateY(-20%)';
  strip.replaceChildren(...labels(index).map(name=>{
   const el=document.createElement('span');el.className='reel-item';el.textContent=title(name);return el;
  }));
  const details=document.getElementById('gpsDetails');
  if(details&&!document.getElementById('directoryDialog').open){
   details.innerHTML=`<h2>${title(selected)}</h2><p>${WORLD_INFO[selected]}</p>`;
  }
 }
 function step(direction){
  if(rolling||busy)return;
  const nextIndex=wrap(index+direction);
  if(paused||matchMedia('(prefers-reduced-motion: reduce)').matches){index=nextIndex;render();return}
  rolling=true;strip.classList.add('rolling',direction>0?'rolling-down':'rolling-up');
  // Force the starting position to paint before translating one complete slot.
  void strip.offsetHeight;
  strip.style.transform=`translateY(${direction>0?'-40%':'0%'})`;
  timer=setTimeout(()=>{index=nextIndex;rolling=false;render()},570);
 }
 document.getElementById('reelUp').addEventListener('click',()=>step(-1));
 document.getElementById('reelDown').addEventListener('click',()=>step(1));
 document.getElementById('reelEnter').addEventListener('click',()=>{if(!rolling)travel(names[index],selector)});
 windowEl.addEventListener('wheel',event=>{event.preventDefault();if(Math.abs(event.deltaY)>3)step(event.deltaY>0?1:-1)},{passive:false});
 windowEl.addEventListener('pointerdown',event=>{pointerY=event.clientY;windowEl.setPointerCapture(event.pointerId)});
 windowEl.addEventListener('pointerup',event=>{if(pointerY===null)return;const delta=event.clientY-pointerY;pointerY=null;if(Math.abs(delta)>24)step(delta<0?1:-1)});
 windowEl.addEventListener('pointercancel',()=>pointerY=null);
 windowEl.addEventListener('keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();step(event.key==='ArrowUp'?-1:1)}else if(event.key==='Enter'){event.preventDefault();travel(names[index],selector)}});
 window.syncWorldSelector=name=>{const destination=names.indexOf(name);if(destination<0)return;clearTimeout(timer);rolling=false;index=destination;render()};
 render();
})();
