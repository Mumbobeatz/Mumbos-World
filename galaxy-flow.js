(()=>{const c=document.getElementById('galaxyFlow'),gl=c.getContext('webgl',{alpha:true,premultipliedAlpha:false});if(!gl)return;const vs='attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';const fs=`precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform float t;// The original texture is the immutable silhouette. Only a compact interior
// around the wormhole may resample it; every outer-edge pixel stays untouched.
vec2 inflow(vec2 d,float phase,float turn,float weight){
 float a=turn+phase*.12;mat2 rotation=mat2(cos(a),-sin(a),sin(a),cos(a));
 return vec2(.4824,.6699)+rotation*d*(1.+phase*.18*weight);
}
// Move only the interior storm texture along elliptical latitude bands. The short
// overlapping phases keep movement continuous without winding up the outline.
vec3 axialStorm(vec2 point,vec2 center,vec2 axes,vec3 original){
 vec2 local=(point-center)/axes;float r=length(local);
 float mask=1.-smoothstep(.55,1.,r);
 float phase=fract(t*.045),other=fract(phase+.5);
 float weight=1.-abs(phase*2.-1.);
 float a=phase*.28,b=other*.28;
 mat2 first=mat2(cos(a),-sin(a),sin(a),cos(a));
 mat2 second=mat2(cos(b),-sin(b),sin(b),cos(b));
 vec3 moved=mix(texture2D(tex,center+(second*local)*axes).rgb,texture2D(tex,center+(first*local)*axes).rgb,weight);
 return mix(original,moved,mask*.85);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float colorNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec4 base=texture2D(tex,uv);vec4 col=base;
 col.rgb=axialStorm(uv,vec2(.49,.65),vec2(.20,.17),col.rgb);
 col.rgb=axialStorm(uv,vec2(.49,.33),vec2(.32,.095),col.rgb);
 vec2 d=uv-vec2(.4824,.6699);float radius=length(d);
 float interior=1.-smoothstep(.06325,.15525,radius);
 float phase=fract(t*.075);float phaseB=fract(phase+.5);
 float blend=1.-abs(phase*2.-1.);
 vec4 flowA=texture2D(tex,inflow(d,phase,t*.20,interior));
 vec4 flowB=texture2D(tex,inflow(d,phaseB,t*.20,interior));
 col.rgb=mix(col.rgb,mix(flowB.rgb,flowA.rgb,blend),interior);
 // Low-amplitude light travels through existing dust, never displacing the brim.
 float dust=exp(-dot((uv-vec2(.50,.48))*vec2(1.,1.4),(uv-vec2(.50,.48))*vec2(1.,1.4))/.025);
 col.rgb*=1.+.035*dust*sin(length(uv-vec2(.4824,.6699))*95.+t*1.2);
 // Soft, dispersed color pockets; retain the brightest white cloud highlights.
 float patches=smoothstep(.50,.62,colorNoise(uv*vec2(15.,11.)));
 float pulse=.35+.65*(.5+.5*sin(t*.65+uv.x*21.+uv.y*17.));
 vec3 hue=.65+.35*cos(vec3(0.,2.1,4.2)+t*.20+uv.x*8.-uv.y*6.);
 float light=max(col.r,max(col.g,col.b));
 float strength=patches*pulse*.36*(1.-smoothstep(.65,1.,light)*.7);
 col.rgb=mix(col.rgb,light*hue*1.25,strength);
 float coreGlow=exp(-dot(d,d)/.00025);
 col.rgb=mix(col.rgb,vec3(.55,.82,1.),coreGlow*.85);
float edge=smoothstep(.0,.10,uv.x)*smoothstep(.0,.10,1.-uv.x)*smoothstep(.0,.08,uv.y)*smoothstep(.0,.08,1.-uv.y);float fade=1.-smoothstep(.52,.74,length((uv-.5)*vec2(1.,1.12)));gl_FragColor=vec4(col.rgb,edge*fade);}`;function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))return null;return s}const v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);if(!v||!f)return;const pr=gl.createProgram();gl.attachShader(pr,v);gl.attachShader(pr,f);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);const image=new Image();image.src='assets/galaxy-v7.webp';image.onload=()=>{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);c.parentElement.querySelector('img').style.opacity=0;let elapsed=0,last=0;const time=gl.getUniformLocation(pr,'t');function render(now){if(!paused&&current==='galaxy')elapsed+=Math.min(now-last,50)/1000;last=now;if(current!=='galaxy'||!c.clientWidth||!c.clientHeight){requestAnimationFrame(render);return}const w=Math.round(c.clientWidth*Math.min(devicePixelRatio,1.5)),h=Math.round(c.clientHeight*Math.min(devicePixelRatio,1.5));if(c.width!==w||c.height!==h){c.width=w;c.height=h;gl.viewport(0,0,w,h)}gl.uniform1f(time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(render)}requestAnimationFrame(render)}})();
