(()=>{
 const pet=document.getElementById('dashPet'),face=document.getElementById('petFace'),speech=document.getElementById('petSpeech');
 const quotes=["That’s a bunch of Mumbo Jumbo!","I mumbo… you mumbo… he, she, we… Mumboooo!","Wake me when the bass drops.","Big hat. Bigger universe.","Beep boop. Certified bass enthusiast.","Are we there yet? Just kidding. Keep exploring!"];
 let lastQuote=-1,bubbleTimer,moodTimer,look={x:0,y:0},target={x:0,y:0};
 const interval=()=>150000+Math.random()*90000;
 let nextSpeech=performance.now()+interval(),nextMood=performance.now()+7000,nextBlink=performance.now()+3000,blinkUntil=0,emotionUntil=0;
 function mood(value,duration=3200){pet.dataset.mood=value;emotionUntil=performance.now()+duration;clearTimeout(moodTimer);moodTimer=setTimeout(()=>pet.dataset.mood='neutral',duration)}
 function speak(){let i;do{i=Math.floor(Math.random()*quotes.length)}while(i===lastQuote);lastQuote=i;speech.textContent=quotes[i];speech.hidden=false;mood('laugh',5000);clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>speech.hidden=true,7500);nextSpeech=performance.now()+interval()}
 pet.dataset.mood='neutral';speech.hidden=true;pet.onclick=speak;
 document.addEventListener('pointermove',e=>{const r=pet.getBoundingClientRect();target.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(innerWidth*.45)));target.y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(innerHeight*.45)))},{passive:true});
 pet.addEventListener('pointerenter',()=>mood('curious',1800));
 // Visible-page timer: each spontaneous phrase arrives 2.5–4 minutes after the last.
 setInterval(()=>{if(document.hidden)return;const now=performance.now();if(now>=nextSpeech)speak();if(!paused&&now>=nextMood){mood(Math.random()<.5?'laugh':'curious');nextMood=now+9000+Math.random()*13000}},1000);
 function animate(now){if(!paused&&!document.hidden){look.x+=(target.x-look.x)*.075;look.y+=(target.y-look.y)*.075;if(now>nextBlink){blinkUntil=now+120;nextBlink=now+2500+Math.random()*4000}const giggle=pet.dataset.mood==='laugh'?Math.sin(now*.035)*1.4:0;face.style.transform=`translate(${look.x*4}px,${look.y*3+giggle}px) rotate(${look.x*3}deg) scaleY(${now<blinkUntil?.12:1})`}requestAnimationFrame(animate)}requestAnimationFrame(animate);
})();
