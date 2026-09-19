(()=>{
 let stars=[],next=600,last=0;
 window.drawMeteors=(ctx,time,w,h)=>{
  const dt=Math.max(0,Math.min((time-last)/1000,.08));last=time;
  if(time>=next){
   const angle=.35+Math.random()*.55,direction=Math.random()<.5?1:-1,speed=250+Math.random()*350;
   stars.push({x:Math.random()*w,y:Math.random()*h*.75,vx:Math.cos(angle)*speed*direction,vy:Math.sin(angle)*speed,age:0,life:1.1+Math.random()*1.1,length:65+Math.random()*100});
   next=time+450+Math.random()*950;
  }
  ctx.save();ctx.lineCap='round';
  stars.forEach(s=>{
   s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
   const speed=Math.hypot(s.vx,s.vy),tx=s.x-s.vx/speed*s.length,ty=s.y-s.vy/speed*s.length;
   ctx.globalAlpha=Math.min(1,s.age/.15)*Math.max(0,1-s.age/s.life)*.8;
   const trail=ctx.createLinearGradient(tx,ty,s.x,s.y);trail.addColorStop(0,'rgba(123,177,255,0)');trail.addColorStop(.8,'rgba(170,210,255,.6)');trail.addColorStop(1,'#f5fcff');
   ctx.strokeStyle=trail;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(s.x,s.y);ctx.stroke();
   ctx.fillStyle='#f5fcff';ctx.beginPath();ctx.arc(s.x,s.y,1.5,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();stars=stars.filter(s=>s.age<s.life&&s.x>-200&&s.x<w+200&&s.y<h+200).slice(-6);
 };
})();
