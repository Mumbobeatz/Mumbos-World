/* Navigation across top-level worlds and the Music Island destinations. */
(()=>{
 const arrows=document.getElementById('worldArrows');
 const worlds=['music','media','about','events','toys'];
 function order(){return SUBWORLDS[current]?MUSIC_ORDER:worlds}
 window.syncWorldArrows=name=>{arrows.hidden=name==='galaxy'||name==='hub';const entries=SUBWORLDS[name]?MUSIC_ORDER:worlds,index=entries.indexOf(name);for(const button of arrows.querySelectorAll('[data-world-step]')){const target=entries[(index+Number(button.dataset.worldStep)+entries.length)%entries.length];button.setAttribute('aria-label',`${Number(button.dataset.worldStep)<0?'Previous':'Next'}: ${SUBWORLDS[target]?.title||WORLDS[target]?.title||target}`)}};
 function navigate(step){if(busy||arrows.hidden||document.getElementById('directoryDialog').open)return;const entries=order(),index=entries.indexOf(current);if(index<0)return;travel(entries[(index+step+entries.length)%entries.length],document.querySelector('.scene.active'))}
 arrows.querySelectorAll('[data-world-step]').forEach(button=>button.addEventListener('click',()=>navigate(Number(button.dataset.worldStep))));
 document.addEventListener('keydown',event=>{if(SUBWORLDS[current]||event.target.closest('input,textarea,#worldSelector')||arrows.hidden)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();navigate(event.key==='ArrowLeft'?-1:1)}});
 window.syncWorldArrows(current);
})();
