const sc='https://soundcloud.com/mumbobeatz',ig='https://instagram.com/mumbobeatz',yt='https://www.youtube.com/@mumbobeatz';
const locationInfo=(name,x,y,kind,description,url,label='Visit',image)=>({name,x,y,kind,description,url,label,image});
const CITIES={
music:{title:'Music Island',kicker:'THE SOUND DISTRICT',image:'music-city',stops:[
 {...locationInfo('Feels Like Heaven',18,39,'The cathedral','Follow the light into the cathedral. Watch the visualizer and find the track on SoundCloud.',sc,'Open SoundCloud','studio'),video:true},
 locationInfo('Feelin’ Pretty Suavé',51,34,'The recording studio','A little funk in the middle of the bass. Explore MUMBO’s releases.',sc,'Browse releases'),
 locationInfo('Live Set Arena',85,29,'Concert hall','Emorfik 1/25, Behind the Decks with Zombae, and more MUMBO sets and videos.',yt,'Open YouTube channel','live'),
 locationInfo('As seen on…',76,76,'The record shop','Step into the EP district and browse the collection on SoundCloud.',sc,'Browse the EP collection'),
 locationInfo('Missed Call',34,16,'Signal station','Missed Call · MUMBO. Find it in the SoundCloud collection.',sc,'Browse SoundCloud'),
 locationInfo('Do It',61,40,'Collaboration block','MUMBO & Scum Wubz · Do It.',sc,'Browse SoundCloud'),
 locationInfo('Party Fix',69,23,'After-hours club','Your next stop on Music Island: Party Fix.',sc,'Browse SoundCloud'),
 locationInfo('Satellite',87,49,'Orbital observatory','Satellite (Mumbo Flip). Take a detour through the flips.',sc,'Browse flips'),
 locationInfo('Eat the Bass',48,69,'Bass depot','Eat the Bass (Mumbo Flip). A stop for the bass heads.',sc,'Browse flips'),
 locationInfo('Secret Stuff',45,10,'Mix bunker','Mumbo’s Secret Stuff Vol. 1 and the mix archive.',sc,'Browse mixes')
]},
media:{title:'Media Center',kicker:'THE BROADCAST DISTRICT',image:'media-city-v5',stops:[
 locationInfo('Insta-Tower',51.5,24,'Instagram / @mumbobeatz','Show moments, new music, and whatever MUMBO is up to next.',ig,'Open Instagram','live'),
 locationInfo('YouTube Cinemark',92.3,19.5,'Sets & videos','Drop into the cinema for MUMBO’s sets and videos.',yt,'Open YouTube channel','bass-bros'),
 locationInfo('Memory Gallery',50,79.4,'Photos & artwork','Show photos, cover art, characters, and little pieces of Mumbo’s World.','https://mumbobeatz.com/highlights','More memories','sophie'),
 locationInfo('TikTok Station',7.8,73.4,'TikTok / @mumbobeatz','Short clips and transmissions from the world.','https://www.tiktok.com/@mumbobeatz','Open TikTok'),
 locationInfo('SoundCloud',27.2,17.5,'Music broadcast','Tracks, flips, and mixes straight from MUMBO.',sc,'Listen on SoundCloud'),
 locationInfo('Social Satellite',92.5,72.7,'All frequencies','Find Spotify, Apple Music, Facebook, X, and the rest of the social links in the directory.',null),

]},
about:{title:'Mumbo’s Moon',kicker:'THE MAN IN THE HAT',image:'moon',stops:[locationInfo('Meet MUMBO',50,60,'Ryan / San Diego','I’m Ryan, aka MUMBO—a San Diego DJ and producer with a love for heavy bass, funky house, and taking the unexpected turn.',ig,'Say hi on Instagram','character')]},
toys:{title:'Mumbo’s Playground',kicker:'UNDER CONSTRUCTION',image:'playground',stops:[]},
events:{title:'Event Central',kicker:'THE LIVE DISTRICT',image:'events-city',stops:[
 locationInfo('Hurtbox · Oct 2',49,26,'Next show / Spin Nightclub','Hurtbox — No Love Lost. October 2, 2026 · San Diego · 9 PM–4 AM · 21+. With support from MUMBO.',ig,'Show updates','hurtbox'),
 locationInfo('Festival Fields',86,37,'Dancefestopia memories','Find moments and memories from Dancefestopia.',ig,'Open Instagram','live'),
 locationInfo('Nova Rooftop',12,38,'From the archive','House music, open skies, good company. Revisit the Nova rooftop announcement.','https://www.instagram.com/p/Cfc1Padpnps/','See the post'),
 locationInfo('Super Bass Bros',87,53,'MUMBO × Balance','Step into the Super Bass Bros artwork and the MUMBO × Balance universe.',ig,'More on Instagram','bass-bros')
]}
};
let selectedStop=null,panelPinned=false,hoverTimer;
function openStop(index,pin=false){const stop=CITIES[current]?.stops[index];if(!stop)return;selectedStop=index;panelPinned=pin;window.showGpsStop?.(stop);document.querySelectorAll('.building').forEach((b,i)=>b.setAttribute('aria-expanded',String(pin&&i===index)));if(!pin)return;const dialog=document.getElementById('directoryDialog');document.getElementById('directoryTitle').textContent=stop.name;document.getElementById('directoryBody').innerHTML=`${stop.image?`<img class="detail-art" src="assets/${stop.image}.webp" alt="${stop.kind}">`:''}<p class="eyebrow">${stop.kind}</p><p>${stop.description}</p>${stop.video?'<video class="detail-video" controls playsinline preload="metadata" src="assets/heaven.mp4"></video>':''}${stop.url?link(stop.url,stop.label,'action-link'):'<button class="action-link" onclick="openDirectory()">Browse all links →</button>'}`;if(!dialog.open)dialog.showModal()}
function closeStop(){window.resetGps?.();selectedStop=null;panelPinned=false;document.querySelectorAll('.building').forEach(b=>b.setAttribute('aria-expanded','false'));clearTimeout(hoverTimer)}
function openDirectory(){const d=document.getElementById('directoryDialog');document.getElementById('directoryTitle').textContent='Explore Mumbo’s World';document.getElementById('directoryBody').innerHTML=`<nav class="gps-worlds" aria-label="World destinations"><button data-go="galaxy">Home galaxy</button><button data-go="hub">World map</button>${Object.entries(WORLDS).map(([key,w])=>`<button data-go="${key}" ${key===current?'aria-current="page"':''}>${w.title}</button>`).join('')}</nav>${WORLDS[current]?`<h3 class="gps-current">${CITIES[current]?.title||'Mumbo’s Moon'}</h3>${WORLDS[current].body()}`:'<p>Choose your next world.</p>'}`;if(!d.open)d.showModal()}
function closeDirectory(){const d=document.getElementById('directoryDialog');d.querySelectorAll('video').forEach(v=>v.pause());document.getElementById('directoryBody').innerHTML='';d.close()}
function showCity(name){const data=CITIES[name];document.getElementById('cityTitle').textContent=data.title;document.getElementById('cityKicker').textContent=data.kicker;const art=document.getElementById('cityArt');art.src=`assets/${data.image}.webp`;art.alt=`An overhead view of ${data.title}, with paths and themed buildings to explore`;document.getElementById('cityHotspots').innerHTML=data.stops.map((s,i)=>`<button class="building ${name==='media'?'billboard':''}" title="${s.kind} — click to explore" style="left:${s.x}%;top:${s.y}%" data-stop="${i}" aria-expanded="false" aria-controls="directoryDialog"><i></i><span>${s.name}</span></button>`).join('');
document.querySelectorAll('.building').forEach(b=>{b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')openStop(Number(b.dataset.stop))});b.addEventListener('focus',()=>{openStop(Number(b.dataset.stop))});b.addEventListener('click',()=>openStop(Number(b.dataset.stop),true));b.addEventListener('pointerleave',()=>clearTimeout(hoverTimer))});
document.getElementById('cityLife').innerHTML=Array.from({length:72},(_,i)=>`<i class="citizen" style="--x:${12+(i*13)%76}%;--y:${35+(i*7)%52}%;--duration:${16+(i%9)*3}s;--delay:-${i*5}s;--distance:${i%2?'-':''}${55+(i%7)*18}px;--rise:${i%3?'-':''}${20+(i%4)*14}px;--tint:${i*37}deg"></i>`).join('')+'<i class="city-flyer traveler ship"></i><i class="city-flyer traveler jetpack"></i>';
if(name==='toys')document.getElementById('cityLife').insertAdjacentHTML('beforeend',[[18,38],[45,25],[58,57],[25,76],[62,80]].map(([x,y])=>`<img class="construction-sign" src="assets/construction-sign.webp" alt="Under construction" style="left:${x}%;top:${y}%">`).join(''));document.getElementById('cityLife').insertAdjacentHTML('beforeend',Array.from({length:4},(_,i)=>`<i class="city-flyer traveler ${i%2?'jetpack':'ship'}" style="top:${18+i*17}%;animation-delay:-${i*11}s;animation-duration:${28+i*7}s"></i>`).join(''));closeStop();requestAnimationFrame(()=>{const v=document.getElementById('cityViewport');v.scrollLeft=(v.scrollWidth-v.clientWidth)/2;v.scrollTop=0});
}
document.getElementById('directoryButton').onclick=openDirectory;document.getElementById('closeDirectory').onclick=closeDirectory;document.getElementById('directoryDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDirectory()});
