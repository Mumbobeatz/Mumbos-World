/* Fit the art and its matching hit areas between the header and GPS. */
(()=>{
 const set=(el,values)=>Object.entries(values).forEach(([key,value])=>el.style.setProperty(key,value,'important'));
 window.fitWorldLayout=()=>{
  const sub=!!SUBWORLDS[current],data=SUBWORLDS[current]||CITIES[current];
  if(!data)return;
  const stage=document.getElementById(sub?'subworldStage':'cityStage');
  const art=document.getElementById(sub?'subworldArt':'cityArt');
  const host=document.getElementById(sub?'subworld':'cityViewport');
  const phone=innerWidth<=700;
  const gps=document.getElementById('worldSelector').getBoundingClientRect();
  const header=document.querySelector('.hud').getBoundingClientRect();
  const panel=document.getElementById('subworldMobileDetails');
  const hasPanel=sub&&phone&&!panel.hidden;
  const top=Math.max(85,header.bottom+14)+(sub?35:phone?60:12);
  const bottom=Math.min(gps.top-24,innerHeight-100);
  const reserve=hasPanel?128:current==='silly-singles'?70:0;
  const ratio=current==='silly-singles'?1:sub?1672/941:data.ratio||1.5;
  const height=Math.max(60,Math.min((innerWidth-(phone?16:140))/ratio,bottom-top-reserve));
  const width=height*ratio;
  const hostTop=host.offsetTop;
  set(stage,{position:'absolute',left:'50%',top:(top-hostTop)+'px',bottom:'auto',width:width+'px',height:height+'px','min-height':'0','min-width':'0','max-width':'none',margin:'0',padding:'0',transform:'translateX(-50%)','aspect-ratio':String(ratio),overflow:'visible'});
  set(art,{width:'100%',height:'100%',transform:'none','object-fit':'contain','object-position':'center'});
  if(sub){
   set(document.getElementById('subworldHotspots'),{width:'100%',height:'100%',transform:'none'});
   set(document.querySelector('.subworld-up'),{top:(header.bottom+4)+'px',height:'32px',width:'44px','font-size':'32px'});
   if(hasPanel)set(panel,{top:(top-hostTop+height+10)+'px','max-height':'118px'});
   if(current==='silly-singles')set(document.getElementById('subworldNotice'),{top:(top-hostTop+height+8)+'px',bottom:'auto'});
  }
  host.scrollTop=0;host.scrollLeft=0;
 };
 addEventListener('resize',()=>requestAnimationFrame(window.fitWorldLayout));
 document.getElementById('cityArt').addEventListener('load',window.fitWorldLayout);
 document.getElementById('subworldArt').addEventListener('load',window.fitWorldLayout);
 new ResizeObserver(()=>requestAnimationFrame(window.fitWorldLayout)).observe(document.getElementById('worldSelector'));
 window.fitWorldLayout();

 /* Moving visitors disappear before entering a sign's protected space. */
 const rect=(el)=>el.getBoundingClientRect();
 const bottomZone=(el,fraction)=>{const r=rect(el);return {left:r.left,right:r.right,top:r.top+r.height*fraction,bottom:r.bottom}};
 let last=0;
 function protectSigns(now){
  if(now-last>80){
   last=now;const zones=[];
   if(current==='hub')document.querySelectorAll('#hub .island').forEach(el=>zones.push(bottomZone(el,.76)));
   if(CITIES[current]){
    const stage=document.getElementById('cityStage');zones.push(bottomZone(stage,.78));
    const r=rect(stage);
    CITIES[current].stops.forEach(stop=>{zones.push({left:r.left+r.width*(stop.x-9)/100,right:r.left+r.width*(stop.x+9)/100,top:r.top+r.height*(stop.y+3)/100,bottom:r.top+r.height*(stop.y+12)/100})});
   }
   document.querySelectorAll('.scene.active .town-sign,.scene.active .building span,.scene.active .city-heading').forEach(el=>{
    if(getComputedStyle(el).opacity!=='0')zones.push(rect(el));
   });
   document.querySelectorAll('.scene.active .citizen,.scene.active .city-flyer,.scene.active .commuter,.scene.active .traveler').forEach(el=>{
    const r=rect(el),blocked=zones.some(z=>r.right>z.left-22&&r.left<z.right+22&&r.bottom>z.top-22&&r.top<z.bottom+22);
    el.style.visibility=blocked?'hidden':'';
   });
  }
  requestAnimationFrame(protectSigns);
 }
 requestAnimationFrame(protectSigns);
})();
