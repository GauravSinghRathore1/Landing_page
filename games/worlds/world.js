'use strict';
const canvas=document.querySelector('canvas'), msg=document.querySelector('#message'), hud=document.querySelector('#hud');
const kind=document.body.dataset.world;
const titles={monsoon:'Monsoon Run',deep:'Deep Signal',train:'Last Train to Dawn',wing:'Glasswing Canyon'};
const tips={
 monsoon:'Drag sideways to steer. Pull down to brake. Hold beside the amber ambulance, then reach the green clinic.',
 deep:'Drag to pilot. Tap the water to send sonar. Near the wreck, drag the brass arm sideways until the claw lines up with the beacon.',
 train:'Drag vertically to walk and sideways to change aisle position. Stop beside a glowing door and swipe right to slide it open. Move the loose evidence into the lit tray.',
 wing:'Drag sideways to bank. Pull down to dive and build speed. Release to climb. Fly through three gold gates before the canyon ends.'
};
const gl=canvas.getContext('webgl',{alpha:false,antialias:true});
document.querySelector('#tips').textContent=tips[kind];
if(!gl){msg.textContent='This game requires WebGL. Enable hardware acceleration or open it in another browser.';}
else launch();
function launch(){
 const vertex='attribute vec3 a;attribute vec3 n;uniform vec3 pos,scale,eye;uniform float aspect,roll,turn;varying float light,depth;void main(){vec3 v=a*scale;float c=cos(turn),s=sin(turn);v.xz=mat2(c,s,-s,c)*v.xz;v+=pos-eye;v.xy=mat2(cos(roll),sin(roll),-sin(roll),cos(roll))*v.xy;float z=v.z;gl_Position=vec4(v.x*1.5/aspect,v.y*1.5,z*1.002-.2,z);light=.64+.36*dot(n,normalize(vec3(-.5,1.,-.7)));depth=z;}';
 const frag='precision mediump float;uniform vec3 color,fog;varying float light,depth;void main(){gl_FragColor=vec4(mix(color*light,fog,smoothstep(25.,103.,depth)*.91),1.);}';
 function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const verts=[];
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){
   const p=[0,0,0],n=[0,0,0];p[axis]=sign*.5;p[(axis+1)%3]=u*.5;p[(axis+2)%3]=v*.5;n[axis]=sign;verts.push(...p,...n);
  }
 }
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
 for(const [attr,offset] of [['a',0],['n',12]]){let loc=gl.getAttribLocation(program,attr);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset);}
 const loc=Object.fromEntries(['pos','scale','eye','aspect','roll','turn','color','fog'].map(k=>[k,gl.getUniformLocation(program,k)]));
 const palette={gold:[1,.77,.26],green:[.25,1,.58],white:[.85,.94,1],metal:[.27,.36,.43],dark:[.09,.12,.18],red:[1,.19,.18],blue:[.15,.49,.68],wood:[.46,.24,.16],sand:[.78,.43,.25],glass:[.18,.66,.69]};
 function box(x,y,z,w,h,d,col,angle=0){gl.uniform3f(loc.pos,x,y,z);gl.uniform3f(loc.scale,w,h,d);gl.uniform3fv(loc.color,palette[col]||col);gl.uniform1f(loc.turn,angle);gl.drawArrays(gl.TRIANGLES,0,36);}
 const fog={monsoon:[.10,.16,.24],deep:[.015,.11,.18],train:[.13,.10,.17],wing:[.5,.66,.77]}[kind];
 gl.enable(gl.DEPTH_TEST);gl.clearColor(...fog,1);gl.uniform3fv(loc.fog,fog);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), keys=new Set();
 let s,touch,last=0;
 function reset(){s={x:0,y:kind==='wing'?6:2,z:0,time:0,dx:0,dy:0,mode:'ready',mission:1,progress:0,hold:0,arm:0,pulse:-9,door:0,tray:0,score:0,next:0,speed:0,damage:0,cool:0};touch=null;keys.clear();msg.textContent='Touch the scene to begin';}
 function end(text){s.mode='end';msg.textContent=text+' · Tap to replay';}
 function begin(){if(s.mode==='end')reset();if(s.mode==='ready'){s.mode='play';msg.textContent='';}}
 const stops=[42,105,169],clinic=[73,139,205],gates=[32,57,82,109,137];
 const lane=i=>[-3,3,-3][i];
 function interact(dx){
  if(kind==='deep'&&s.z>40&&Math.abs(s.x-2)<2.8){s.arm=clamp(s.arm+dx,-3,3);if(Math.abs(s.arm-1.7)<.32)end('Beacon recovered from the wreck');}
  if(kind==='train'&&Math.abs(s.z-(18+24*s.progress))<3&&s.x>0){
   if(s.door<1)s.door=clamp(s.door+dx,0,1);
   else{s.tray=clamp(s.tray+dx,0,1);if(s.tray>=1){s.progress++;s.door=0;s.tray=0;if(s.progress===3)end('Case solved. The conductor forged all three station records');}}
  }
 }
 canvas.onpointerdown=e=>{if(touch)return;begin();canvas.focus();canvas.setPointerCapture(e.pointerId);touch={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,travel:0};};
 canvas.onpointermove=e=>{if(!touch||touch.id!==e.pointerId)return;let x=e.clientX-touch.x,y=e.clientY-touch.y;touch.travel=Math.max(touch.travel,Math.hypot(x,y));s.dx=clamp(x/55,-1,1);s.dy=clamp(y/55,-1,1);if(s.mode==='play')interact((e.clientX-touch.lastX)/72);touch.lastX=e.clientX;};
 function release(e){if(!touch||touch.id!==e.pointerId)return;if(e.type==='pointerup'&&kind==='deep'&&touch.travel<12)s.pulse=s.time;touch=null;s.dx=s.dy=0;}
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
 canvas.onkeydown=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))return;e.preventDefault();if(!e.repeat)begin();keys.add(e.key);if(e.key===' '){s.pulse=s.time;interact(.21);}};
 canvas.onkeyup=e=>keys.delete(e.key);
 window.addEventListener('blur',()=>{keys.clear();touch=null;s.dx=s.dy=0;});
 function update(dt){
  s.time+=dt;const dx=s.dx+Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),dy=s.dy+Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'));
  const oldZ=s.z;
  s.x=clamp(s.x+dx*dt*(kind==='train'?3:7),kind==='train'?-1.3:-5,kind==='train'?1.3:5);
  if(kind==='monsoon'){
   const i=s.mission-1,near=Math.abs(s.z-stops[i])<4&&Math.abs(s.x-lane(i))<2;
   s.speed=dy>.35?0:7;
   if(near&&!s.progress){s.speed=0;s.hold+=(touch||keys.has(' '))?dt:0;if(s.hold>1){s.progress=1;s.hold=0;}}
   s.z+=s.speed*dt;
   if(!s.progress&&s.z>stops[i]+4){s.z=stops[i]+3;s.speed=0;}
   const danger=Math.abs(s.x-Math.sin(i+1)*3)<1.35&&Math.abs(s.z-(stops[i]+13))<2;
   if(danger)s.damage+=dt*45;
   if(s.z>=clinic[i]&&s.progress){if(s.mission===3)return end('All three crews made it to the clinic');s.mission++;s.progress=0;}
   if(s.damage>=100)return end('The van stalled in flood debris');
   hud.textContent='Rescue '+s.mission+'/3 · Van '+Math.max(0,100-Math.floor(s.damage))+'%';
   msg.textContent=s.progress?'Crew aboard · Reach the green clinic':near?'Hold to load the crew':'Find the amber ambulance';
  }else if(kind==='deep'){
   s.z=clamp(s.z-dy*dt*7,0,49);s.y=2+.3*Math.sin(s.time);
   hud.textContent='Wreck '+Math.max(0,Math.round(46-s.z))+' m · Sonar '+(s.time-s.pulse<2?'active':'ready');
   msg.textContent=s.z>40&&Math.abs(s.x-2)<2.8?'Slide right to align the claw': 'Push upward to dive toward the wreck';
  }else if(kind==='train'){
   s.z=clamp(s.z-dy*dt*8,0,73);s.y=1.65+.025*Math.sin(s.time*9);
   hud.textContent='Evidence '+s.progress+'/3 · Compartment '+(s.progress+1);
   msg.textContent=Math.abs(s.z-(18+24*s.progress))<3&&s.x>0?(s.door<1?'Swipe right to open the compartment':'Drag the evidence right into the tray'):'Walk toward the amber door on the right';
  }else{
   s.speed=clamp(10+dy*5,8,17);s.z+=dt*s.speed;s.y=clamp(s.y+dt*(dy>.1?-3.8:1.55),2,10);
   if(s.next<gates.length&&oldZ<gates[s.next]&&s.z>=gates[s.next]){
    if(Math.abs(s.x-Math.sin(s.next*2)*3)<2.45&&Math.abs(s.y-(5+s.next%3))<2.3)s.score++;
    s.next++;
   }
   hud.textContent='Gates '+s.score+'/3 · Altitude '+s.y.toFixed(1)+' m';
   msg.textContent='';if(s.z>149)end(s.score>=3?'Canyon course cleared':'Run complete. Catch three gates to qualify');
  }
 }
 function city(){
  const n=Math.floor(s.z/8);
  box(0,-.3,s.z+38,15,.5,90,'metal');
  for(let i=n;i<n+10;i++){let z=i*8;
   for(const side of [-1,1]){let h=6+(i*7%12);box(side*10,h/2,z,5,h,6,'dark');for(let j=2;j<h;j+=3)box(side*7.46,j,z,.08,.7,3,'gold');box(side*6,.05,z,.12,.06,7,'white');}
   box(0,.01,z,.12,.05,3,'gold');box(1,.04,z+2,3,.03,1.7,'blue');
  }
  stops.forEach((z,i)=>{box(lane(i),1,z,2,1.9,4,'white');box(lane(i),2.1,z,.9,.25,.5,'gold');box(lane(i),1,z-2.03,1,.45,.05,'red');box(0,4,clinic[i],12,.4,.6,'green');box(Math.sin(i+1)*3,.45,z+13,2,.8,1,'wood');});
  for(let i=0;i<55;i++){let z=s.z+2+(i*17%44);box((i*37%22)-11,(i*13-s.time*15)%9+5,z,.024,.38,.025,'glass');}
  box(s.x,.79,s.z+2,1.65,.48,1.2,'red');
 }
 function sea(){
  box(0,-1,s.z+30,80,.5,95,'metal');
  for(let i=0;i<54;i++){let z=i*1.27;box(Math.sin(i*17)*12,-.42,z,.3+i%3,.6+i%2,1.7,'glass');}
  const pulse= s.time-s.pulse;
  for(let i=0;i<10;i++){let z=47+i*1.2,c=pulse<2?'glass':'metal';box(-2,1.1,z,.26,3,.35,c);box(5,1.1,z,.26,3,.35,c);box(1.5,3,z,7.3,.25,.3,c);}
  box(3.7,1.5,51,.6,1,.6,'gold');
  box(s.x+s.arm*.35,s.y-.63,s.z+1.9,.12,.2,1.3,'gold');
  if(pulse<2)for(let i=0;i<48;i++){let a=i*Math.PI/24,r=pulse*16+.3;box(s.x+Math.cos(a)*r,.15,s.z+Math.sin(a)*r,.35,.06,.35,'green');}
 }
 function carriage(){
  box(0,-.1,40,5,.2,90,'wood');box(0,3.3,40,5,.25,90,'metal');
  for(let i=Math.floor(s.z/4);i<Math.floor(s.z/4)+13;i++){let z=i*4;
   for(const side of [-1,1]){box(side*2.5,1.5,z,.16,3,4,'wood');box(side*2.39,1.8,z,.06,1.35,2.7,Math.sin(s.time*2+i)>0?'blue':'dark');box(side*1.95,.5,z+1,.85,.65,.7,'red');}
   box(0,3.12,z,.9,.06,.4,'gold');
  }
  for(let i=s.progress;i<3;i++){let z=18+i*24;
   box(2,1.4,z+2+(i===s.progress?s.door:0)*2,.2,2.45,1.8,'gold');
   if(i===s.progress&&s.door>=1){box(1.15+s.tray*.65,1,z+3,.4,.2,.5,'white');box(1.9,.82,z+3,.6,.08,.6,'green');}
  }
 }
 function canyon(){
  box(0,-1,s.z+40,95,.8,104,'sand');box(0,-.55,s.z+40,4,.08,103,'blue');
  for(let i=Math.floor(s.z/5);i<Math.floor(s.z/5)+18;i++)for(const side of [-1,1]){
   let h=9+Math.sin(i*1.8+side)*4,x=side*(12+Math.sin(i*.7)*2);
   for(let j=0;j<3;j++)box(x,j*h/3+h/6,i*5,10-j*1.7,h/3,6,j===1?'wood':'sand',Math.sin(i)*.15);
  }
  gates.forEach((z,i)=>{let x=Math.sin(i*2)*3,y=5+i%3;
   for(const sign of [-1,1]){box(x+sign*2.6,y,z,.22,4.8,.4,'gold');box(x,y+sign*2.4,z,5.4,.22,.4,'gold');}
  });
  box(s.x,s.y-.48,s.z+2.3,2.2,.08,.35,'red');box(s.x,s.y-.46,s.z+2.3,.17,.18,1,'white');
 }
 const scenes={monsoon:city,deep:sea,train:carriage,wing:canyon};
 function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(s.mode==='play')update(dt);
  let dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(loc.aspect,w/h);
  gl.uniform3f(loc.eye,s.x,s.y,s.z);gl.uniform1f(loc.roll,kind==='wing'?-s.dx*.17:0);scenes[kind]();
  requestAnimationFrame(frame);
 }
 reset();requestAnimationFrame(frame);
}
