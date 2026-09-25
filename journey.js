/* Continuous layered camera push, adapted from the supplied motion reference. */
(()=>{
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;
 let frame=0,cleanup=null,raw={x:0,y:0},smooth={x:0,y:0};
 document.addEventListener('pointermove',e=>{raw={x:(e.clientX/innerWidth-.5)*2,y:(e.clientY/innerHeight-.5)*2}},{passive:true});
 window.captureFlightScene=source=>{
  const clone=source.cloneNode(true);clone.dataset.flightFrom=source.id;
  const originals=[source,...source.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
  originals.forEach((node,i)=>{
   const copy=copies[i],style=getComputedStyle(node);
   for(const property of style)copy.style.setProperty(property,style.getPropertyValue(property));
   copy.removeAttribute('id');copy.removeAttribute('autofocus');copy.style.animation='none';copy.style.transition='none';
   // Preserve the visible hat/portal geometry during entry. Responsive !important
   // rules must not reposition the snapshot after the home scene is hidden.
   if(source.id==='galaxy'&&(node.classList.contains('galaxy-art')||node.classList.contains('portal'))){
    for(const property of ['left','top','right','bottom','width','height','transform','transform-origin'])
     copy.style.setProperty(property,style.getPropertyValue(property),'important');
   }

   if(node.tagName==='CANVAS'){
    const replacement=document.createElement('img');replacement.src='assets/galaxy-v7.webp';replacement.style.cssText=copy.style.cssText;replacement.style.opacity='1';copy.replaceWith(replacement);
   }
  });
  clone.classList.remove('scene','active');clone.classList.add('flight-snapshot');clone.hidden=false;clone.inert=true;clone.setAttribute('aria-hidden','true');
  const bounds=source.getBoundingClientRect();
  clone.dataset.snapshotLeft=String(bounds.left);clone.dataset.snapshotTop=String(bounds.top);
  Object.assign(clone.style,{position:'fixed',inset:'auto',left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px',zIndex:'19',margin:'0',transform:'none',opacity:'1',pointerEvents:'none'});
  document.body.append(clone);return clone;
 };
 window.cancelFlight=()=>{cancelAnimationFrame(frame);cleanup?.();cleanup=null};
 window.runFlight=(source,target,point,reverse,done)=>{
  const original=target.getAttribute('style');
  const throughPortal=!reverse&&source.dataset?.flightFrom==='galaxy';
  const sourceUI=[...source.querySelectorAll('.portal-label,.hanging-sign,.entry-note,.map-caption,.city-heading,.island-sign')];
  const targetUI=[...target.querySelectorAll('.city-heading,.map-caption,.portal-label,.entry-note')];
  const uiStyles=targetUI.map(el=>el.getAttribute('style'));
  const restore=()=>{
   source.remove();if(original===null)target.removeAttribute('style');else target.setAttribute('style',original);
   targetUI.forEach((el,i)=>{if(uiStyles[i]===null)el.removeAttribute('style');else el.setAttribute('style',uiStyles[i])});
  };
  cleanup=restore;
  const bounds=target.getBoundingClientRect();
  const originX=point.x-Number(source.dataset.snapshotLeft||0),originY=point.y-Number(source.dataset.snapshotTop||0);
  const targetX=point.x-bounds.left,targetY=point.y-bounds.top;
  const centerX=bounds.left+bounds.width/2,centerY=bounds.top+bounds.height*.45;
  source.style.transformOrigin=`${originX}px ${originY}px`;
  Object.assign(target.style,{transformOrigin:reverse?`${targetX}px ${targetY}px`:'50% 45%',willChange:'transform,opacity',animation:'none',transition:'none'});
  const isWorldArrival=!reverse&&(target.id==='city'||target.id==='subworld');
  const isWorldDeparture=reverse&&(source.dataset?.flightFrom==='city'||source.dataset?.flightFrom==='subworld');
  const mist=(isWorldArrival||isWorldDeparture)?document.createElement('div'):null;
  if(mist){mist.className='world-arrival-mist';document.body.append(mist)}
  const previousRestore=cleanup;
  cleanup=()=>{mist?.remove();previousRestore()};
  const start=performance.now(),duration=2400;
  function render(now){
   const p=paused?1:clamp((now-start)/duration),ep=ease(p);
   smooth.x+=(raw.x-smooth.x)*.07;smooth.y+=(raw.y-smooth.y)*.07;
   const x=-smooth.x,y=-smooth.y;
   if(!reverse){
    if(throughPortal){
     source.style.transform=`translate(${(innerWidth/2-point.x)*ep}px,${(innerHeight*.45-point.y)*ep}px) scale(${1+14*ep})`;
     const opening=clamp((p-.28)/.60)*45;
     const aperture=`radial-gradient(circle at ${originX}px ${originY}px,transparent ${opening}px,#000 ${opening+9}px)`;
     source.style.maskImage=aperture;source.style.webkitMaskImage=aperture;
     source.style.opacity=String(1-clamp((p-.88)/.12));
    }else{
     source.style.transform=`translate(${(centerX-point.x)*ep}px,${(centerY-point.y)*ep}px) scale(${1+6.5*ep})`;
     source.style.opacity=String(1-clamp((p-(isWorldArrival ? .76 : .65))/.2));
    }
    const arrival=isWorldArrival?clamp((p-.72)/.27):clamp(p/.18);
    target.style.transform=isWorldArrival?`scale(${1.18-.18*ease(arrival)}) translate(${x*6*(1-arrival)}px,${y*6*(1-arrival)}px)`:`scale(${(1+.18*ep)/1.18}) translate(${x*6*(1-p)}px,${y*6*(1-p)}px)`;
    target.style.opacity=String(arrival);
    if(isWorldArrival)target.style.filter=`blur(${(1-arrival)*9}px)`;
   }else{
    source.style.transformOrigin='50% 45%';
    source.style.transform=`scale(${1-.153*ep}) translate(${x*6*ep}px,${y*6*ep}px)`;
    source.style.opacity=String(1-clamp((p-.65)/.25));
    target.style.transform=`translate(${(centerX-point.x)*(1-ep)}px,${(centerY-point.y)*(1-ep)}px) scale(${7.5-6.5*ep})`;
    target.style.opacity=String(clamp((p-.15)/.2));
    target.style.zIndex='20';source.style.zIndex='18';
   }
   sourceUI.forEach(el=>el.style.opacity=String(1-clamp(p/.22)));
   targetUI.forEach(el=>el.style.opacity=String(clamp((p-.68)/.16)));
   if(mist){const cloudProgress=isWorldArrival?clamp((p-.58)/.42):clamp((p-.08)/.64);mist.style.opacity=String(Math.sin(Math.PI*cloudProgress)*.82)}
   if(p<1)frame=requestAnimationFrame(render);else{mist?.remove();restore();cleanup=null;done()}
  }
  render(start);
 };
 // Adjacent destinations travel around a horizontal orbit instead of flying out/in.
 window.runOrbit=(source,target,direction,done)=>{
  const original=target.getAttribute('style'),sign=direction<0?-1:1;
  const width=target.getBoundingClientRect().width,radius=width*.78,depth=Math.max(900,width*1.4);
  const restore=()=>{source.remove();target.classList.remove('orbiting');if(original===null)target.removeAttribute('style');else target.setAttribute('style',original)};
  const mist=document.createElement('div');mist.className='world-arrival-mist';document.body.append(mist);
  cleanup=()=>{mist.remove();restore()};source.classList.add('orbiting');target.classList.add('orbiting');
  for(const el of [source,target])Object.assign(el.style,{transformOrigin:'50% 50%',animation:'none',transition:'none',willChange:'transform,opacity'});
  const start=performance.now(),duration=900;
  function render(now){
   const p=paused?1:clamp((now-start)/duration),ep=ease(p);
   const outgoing=ep*Math.PI/2,incoming=(1-ep)*Math.PI/2;
   source.style.transform=`perspective(${depth}px) translateX(${-sign*Math.sin(outgoing)*radius}px) translateZ(${-radius*.35*(1-Math.cos(outgoing))}px) rotateY(${-sign*outgoing*20}deg)`;
   target.style.transform=`perspective(${depth}px) translateX(${sign*Math.sin(incoming)*radius}px) translateZ(${-radius*.35*(1-Math.cos(incoming))}px) rotateY(${sign*incoming*20}deg)`;
   source.style.opacity=String(1-ep);target.style.opacity=String(ep);
   mist.style.opacity=String(Math.pow(Math.sin(Math.PI*p),2)*.75);
   if(p<1)frame=requestAnimationFrame(render);else{mist.remove();restore();cleanup=null;done()}
  }
  render(start);
 };
})();
