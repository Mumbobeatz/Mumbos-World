const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current='galaxy',busy=false,paused=reduced.matches,travelTimers=[],lastTravel=0,zoomSum=0,wheelTimer,lastWheel=0,hoveredIsland=null,travelVersion=0,lastWheelEvent=0,wheelLocked=false;
const destination=$('#destination'),worldBackground=$('#worldBackground'),warp=$('#warp');
function motionState(){document.body.classList.toggle('paused',paused);$('#motion').textContent=paused?'Resume motion':'Pause motion';$('#motion').setAttribute('aria-pressed',String(paused))}
motionState();$('#motion').onclick=()=>{paused=!paused;motionState()};
function closeMenu(){$('#quickNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false')}
$('#menuToggle').onclick=()=>{const open=$('#quickNav').hidden;$('#quickNav').hidden=!open;$('#menuToggle').setAttribute('aria-expanded',String(open))};
function present(name){closeStop();document.querySelectorAll('.scene').forEach(el=>{el.hidden=true;el.classList.remove('active','departing','arriving','returning','retreating');el.style.transformOrigin='';el.style.transform=''});let scene;current=name;
if(SUBWORLDS[name]){window.showSubworld?.(name);scene=$('#subworld')}else if(CITIES[name]){showCity(name);scene=$('#city')}else if(WORLDS[name]){const data=WORLDS[name];$('#worldTitle').textContent=data.title;$('#worldKicker').textContent=data.kicker;$('#worldSubtitle').textContent=data.subtitle;$('#worldBody').innerHTML=data.body();worldBackground.style.backgroundImage=`url(assets/${data.background}.webp)`;worldBackground.style.backgroundPosition=data.position||'center';worldBackground.style.backgroundSize='cover';scene=destination;scene.scrollTop=0}else scene=$('#'+name);
scene.hidden=false;scene.classList.add('active');document.body.dataset.scene=name;window.syncWorldArrows?.(name);if(name==='galaxy')window.placeGalaxy?.();window.syncWorldSelector?.(name);document.title=(SUBWORLDS[name]?.title||CITIES[name]?.title||WORLDS[name]?.title||'Mumbo’s World')+' — MUMBO';$('#announcement').textContent=SUBWORLDS[name]?.title||CITIES[name]?.title||WORLDS[name]?.title||(name==='hub'?'Choose your world':'The bucket hat galaxy');return scene}
function cancelTravel(){travelVersion++;window.cancelFlight?.();travelTimers.forEach(clearTimeout);travelTimers=[];busy=false;warp.classList.remove('travel');$('#flightView').hidden=true;document.body.classList.remove('in-warp');$('#speedReadout').textContent='CRUISE';zoomSum=0}
const destinationImages=new Map();
function readyDestination(name){
 const data=SUBWORLDS[name]||CITIES[name];if(!data?.image)return Promise.resolve();
 const src=`assets/${data.image}.webp`;
 if(!destinationImages.has(src)){const image=new Image();image.src=src;destinationImages.set(src,image.decode().catch(()=>{}))}
 return destinationImages.get(src);
}
async function travel(name,origin,fromHistory=false,orbitDirection=0){
 if(busy||name===current||!(SUBWORLDS[name]||WORLDS[name]||['galaxy','hub'].includes(name)))return;
 closeMenu();if($('#directoryDialog').open)closeDirectory();closeStop();
 busy=true;lastTravel=performance.now();zoomSum=0;
 const version=++travelVersion;
 await readyDestination(name);
 if(version!==travelVersion)return;
 document.querySelectorAll('video').forEach(v=>v.pause());
 const previous=current,reverse=name==='galaxy'||(name==='hub'&&!!CITIES[previous])||(name==='music'&&!!SUBWORLDS[previous]);
 if(!orbitDirection&&CITIES[previous]&&CITIES[name]){const worlds=['music','media','about','events','toys'],delta=(worlds.indexOf(name)-worlds.indexOf(previous)+worlds.length)%worlds.length;orbitDirection=delta<=worlds.length/2?1:-1}
 const finish=()=>{if(name==='galaxy')window.placeGalaxy?.();busy=false;lastTravel=performance.now();document.body.classList.remove('in-warp');$('#speedReadout').textContent='CRUISE';if(!fromHistory)history.pushState({scene:name},'','#'+name);const focus=SUBWORLDS[name]?$('#subworldTitle'):CITIES[name]?$('#cityTitle'):WORLDS[name]?$('#worldTitle'):name==='hub'?$('.music-island'):$('.portal');focus?.focus({preventScroll:true})};
 if(paused){present(name);finish();return}
 const old=$('.scene.active');
 const snapshot=window.captureFlightScene(old);
 let point=origin;
 if(previous==='galaxy')point=$('.portal');
 else if(previous==='hub'&&CITIES[name])point=document.querySelector(`.island[data-go="${name}"]`);
 else if(previous==='music'&&SUBWORLDS[name])point=origin||document.querySelector(`.building[data-stop="${CITIES.music.stops.findIndex(stop=>stop.go===name)}"]`);
 let rect=point?.getBoundingClientRect();
 const scene=present(name);
 if(reverse){point=name==='galaxy'?$('.portal'):name==='music'?document.querySelector(`.building[data-stop="${CITIES.music.stops.findIndex(stop=>stop.go===previous)}"]`):document.querySelector(`.island[data-go="${previous}"]`);rect=point?.getBoundingClientRect()}
 const center={x:rect?rect.left+rect.width/2:innerWidth/2,y:rect?rect.top+rect.height/2:innerHeight*.45};
 document.body.classList.add('in-warp');$('#speedReadout').textContent=reverse?'DEPARTURE':'APPROACH';
 if(orbitDirection)window.runOrbit(snapshot,scene,orbitDirection,finish);
 else window.runFlight(snapshot,scene,center,reverse,finish);
}
document.addEventListener('click',e=>{const go=e.target.closest('[data-go]');if(go)travel(go.dataset.go,go);else if(!e.target.closest('#quickNav,#menuToggle'))closeMenu()});
document.querySelectorAll('.island').forEach(b=>{b.addEventListener('pointerenter',()=>hoveredIsland=b);b.addEventListener('pointerleave',()=>hoveredIsland=null)});
window.addEventListener('wheel',e=>{if(Math.abs(e.deltaX||0)>Math.abs(e.deltaY)||e.ctrlKey||e.target.closest('#cockpit,#directoryDialog,#quickNav'))return;if(!['galaxy','hub'].includes(current)&&!CITIES[current]&&!SUBWORLDS[current])return;const now=performance.now(),quiet=now-lastWheelEvent;lastWheelEvent=now;if(busy||now-lastTravel<350){wheelLocked=true;e.preventDefault();return}if(wheelLocked&&quiet<180){e.preventDefault();return}wheelLocked=false;let target=null,origin=null;if(e.deltaY>0){if(current==='hub')target='galaxy';else if(SUBWORLDS[current])target='music';else if(CITIES[current])target='hub'}else if(e.deltaY<0){if(current==='galaxy'){target='hub';origin=$('.portal')}else if(current==='hub'){origin=e.target.closest('.island')||hoveredIsland;target=origin?.dataset.go}}
if(!target)return;e.preventDefault();if(now-lastWheel>220||Math.sign(zoomSum)!==Math.sign(e.deltaY))zoomSum=0;lastWheel=now;zoomSum+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>zoomSum=0,240);if(Math.abs(zoomSum)>=65){wheelLocked=true;travel(target,origin)}
},{passive:false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#directoryDialog').open){e.preventDefault();closeDirectory()}else if(selectedStop!==null)closeStop();else if(!$('#quickNav').hidden){closeMenu();$('#menuToggle').focus()}else if(current!=='galaxy')travel(SUBWORLDS[current]?'music':current==='hub'?'galaxy':'hub')}});
window.addEventListener('popstate',()=>{cancelTravel();const name=location.hash.slice(1)||'galaxy';present(SUBWORLDS[name]||WORLDS[name]||['galaxy','hub'].includes(name)?name:'galaxy')});
const initial=location.hash.slice(1);if(SUBWORLDS[initial]||WORLDS[initial]||initial==='hub')present(initial);
const cursor=$('#cursor');cursor.src='assets/cursor.webp';document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){document.body.classList.add('custom-cursor');cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}});document.documentElement.addEventListener('pointerleave',()=>document.body.classList.remove('custom-cursor'));
const canvas=$('#stars'),ctx=canvas.getContext('2d');let dots=[],w=innerWidth,h=innerHeight,last=0,time=0;function resize(){w=innerWidth;h=innerHeight;canvas.width=w;canvas.height=h;dots=Array.from({length:440},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.4+.3,p:Math.random()*6.28}));draw(0)}function draw(t){ctx.clearRect(0,0,w,h);dots.forEach(d=>{ctx.globalAlpha=.2+(Math.sin(t*.001+d.p)+1)*.3;ctx.fillStyle='#b5dfff';ctx.beginPath();ctx.arc((d.x+t*.0015)%w,d.y,d.r,0,Math.PI*2);ctx.fill()});window.drawMeteors?.(ctx,t,w,h)}function tick(t){if(!paused&&t-last>40){time+=40;draw(time);last=t}requestAnimationFrame(tick)}resize();addEventListener('resize',resize);requestAnimationFrame(tick);

// A modal occupies the browser top layer; move both the custom cursor and its trail into it.
(()=>{const modal=document.getElementById('directoryDialog'),pointer=document.getElementById('cursor'),trail=document.getElementById('cursorSmoke');new MutationObserver(()=>{const host=modal.open?modal:document.body;host.append(trail,pointer)}).observe(modal,{attributes:true,attributeFilter:['open']})})();

// Finish resize recovery in the active scene without leaving an animation lock.
addEventListener('resize',()=>{if(busy){cancelTravel();present(current)}});
const warmWorlds=()=>Object.keys({...CITIES,...SUBWORLDS}).forEach(readyDestination);
if('requestIdleCallback' in window)requestIdleCallback(warmWorlds,{timeout:2000});else setTimeout(warmWorlds,500);
