import {streets,jobs,createRun,drive,target,traffic,clamp,walk} from './city.js';
import {renderer} from './graphics.js';

const byId=id=>document.getElementById(id);
const canvas=byId('scene'),panel=byId('panel'),go=byId('go'),pause=byId('pause');
const map=byId('map').getContext('2d'),keys=new Set();
let state=createRun(),mode='title',touch=null,cruise=false,last=0,cameraAngle=state.heading,tick=0;
let engine;
function failure(error){
 mode='error';panel.hidden=false;pause.hidden=true;go.hidden=true;
 byId('title').textContent='Graphics unavailable';byId('copy').textContent=error.message;
 byId('controls').hidden=true;
}
try{engine=renderer(canvas);}catch(error){failure(error);}
function clearInput(){touch=null;keys.clear();cruise=false;}
const swap=byId('switch');
function swapMode(){
 if(mode!=='play')return;
 if(state.person){
  if(Math.hypot(state.person.x-state.x,state.person.z-state.z)>4)return;
  state.person=null;cruise=false;
 }else{
  if(Math.abs(state.v)>1)return;
  const dx=Math.cos(state.heading)*1.8,dz=-Math.sin(state.heading)*1.8;
  const positions=[1,-1].map(sign=>({x:state.x+dx*sign,z:state.z+dz*sign}));
  const spot=positions.find(p=>Math.abs(p.x)<142&&Math.abs(p.z)<142&&!engine.blocks.some(b=>Math.abs(p.x-b.x)<b.w/2+.4&&Math.abs(p.z-b.z)<b.d/2+.4));
  if(!spot)return;
  state.v=0;state.person={...spot,heading:state.heading,step:0};cruise=false;
 }
 touch=null;canvas.focus();hud();
}
swap.onclick=swapMode;
function playing(){
 mode='play';panel.hidden=true;pause.hidden=false;swap.hidden=false;cruise=!state.person;
 document.querySelector('.objective').hidden=false;document.querySelector('.instruments').hidden=false;
 canvas.focus({preventScroll:true});last=performance.now();
}
function pauseGame(){
 if(mode!=='play')return;
 mode='pause';swap.hidden=true;clearInput();panel.hidden=false;pause.hidden=true;
 byId('title').textContent='Parked';byId('copy').textContent='Your route and job timer are paused.';go.textContent='Resume drive';go.focus();
}
go.onclick=playing;pause.onclick=pauseGame;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
window.addEventListener('blur',pauseGame);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInput();failure(Error('Graphics interrupted. Reload this page to start a new drive.'));});
canvas.onpointerdown=e=>{
 if(mode!=='play'||touch||e.button!==0)return;
 canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});cruise=true;
 touch={id:e.pointerId,x:e.clientX,y:e.clientY,steer:0,brake:false};
};
canvas.onpointermove=e=>{
 if(e.pointerId!==touch?.id)return;
 touch.steer=clamp((e.clientX-touch.x)/Math.min(86,canvas.clientWidth*.21),-1,1);
 touch.brake=e.clientY-touch.y>32;
};
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(touch?.id===e.pointerId){if(touch.brake&&Math.abs(state.v)<2){state.v=0;cruise=false;}touch=null;}});
const driveKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','s','d','w'];
canvas.onkeydown=e=>{
 if(e.key.toLowerCase()==='e'&&!e.repeat){swapMode();return;}
 if(e.key==='Escape'){pauseGame();return;}
 if(mode!=='play'||!driveKeys.includes(e.key))return;
 e.preventDefault();keys.add(e.key);cruise=false;
};
window.onkeyup=e=>keys.delete(e.key);
function input(){
 return {gas:(state.person?Boolean(touch):cruise)||keys.has('w')||keys.has('ArrowUp'),brake:touch?.brake||keys.has('s')||keys.has('ArrowDown'),
 steer:clamp((touch?.steer||0)+Number(keys.has('d')||keys.has('ArrowRight'))-Number(keys.has('a')||keys.has('ArrowLeft')),-1,1)};
}
const mapPos=(x,z)=>[126+x*.77,130-z*.77];
function minimap(){
 map.fillStyle='#14222f';map.fillRect(0,0,260,260);
 map.fillStyle='#265062';map.fillRect(238,0,22,260);
 map.strokeStyle='#546572';map.lineWidth=4;
 for(const road of streets){
  const [x,y]=mapPos(road,road);map.beginPath();map.moveTo(x,18);map.lineTo(x,241);map.moveTo(14,y);map.lineTo(238,y);map.stroke();
 }
 const actor=state.person||state;
 const to=state.person?[state.x,state.z]:target(state),[x,y]=mapPos(actor.x,actor.z);
 if(to){
  const [gx,gy]=mapPos(...to);
  const closest=v=>streets.reduce((a,b)=>Math.abs(a-v)<Math.abs(b-v)?a:b);
  const [ix,iy]=mapPos(closest(state.x),closest(state.z));
  map.strokeStyle='#ffbc6c';map.lineWidth=3;map.beginPath();map.moveTo(x,y);
  if(Math.abs(state.x-closest(state.x))<Math.abs(state.z-closest(state.z))){map.lineTo(ix,y);map.lineTo(ix,gy);}
  else{map.lineTo(x,iy);map.lineTo(gx,iy);}
  map.lineTo(gx,gy);map.stroke();map.beginPath();map.arc(gx,gy,7,0,Math.PI*2);map.fillStyle='#ffc377';map.fill();
 }
 map.save();map.translate(x,y);map.rotate(actor.heading);map.beginPath();map.moveTo(0,-10);map.lineTo(7,7);map.lineTo(0,4);map.lineTo(-7,7);map.closePath();map.fillStyle='#fff';map.fill();map.restore();
}
function hud(){
 byId('speed').textContent=Math.round(Math.abs(state.v)*3.6);
 swap.textContent=state.person?'Enter car':'Exit car';
 swap.disabled=state.person?Math.hypot(state.person.x-state.x,state.person.z-state.z)>4:Math.abs(state.v)>1;
 const job=jobs[state.job];
 const district=state.x>84?'Ferry Quay':state.z>84?'Crown Heights':state.x< -54?'Print District':'Glass Market';
 byId('district').textContent=district+' · '+state.cleared+'/3 deliveries';
 const prompt=state.time<state.noticeUntil?state.notice:!job?'Free roam · All deliveries complete':state.loaded?job.finish:job.start;
 const text=prompt+(state.loaded?' · '+Math.ceil(state.left)+' s':'');
 byId('brief').textContent=state.person?'On foot · Map marks your parked coupe':text;
 if(state.time<state.noticeUntil&&byId('announce').textContent!==state.notice)byId('announce').textContent=state.notice;
 minimap();
}
function frame(now){
 if(mode==='error')return;
 const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;
 if(mode==='play'){
  let remaining=dt;
  while(remaining>.00001){const step=Math.min(remaining,1/60);if(state.person){walk(state.person,input(),step,engine.blocks);state.time+=step;if(state.loaded && (state.left-=step)<=0){state.loaded=false;}}
   else drive(state,input(),step,engine.blocks,traffic(state.time));remaining-=step;}
  if(now-tick>80){hud();tick=now;}
 }
 // Shorten the chase camera when a building sits behind the coupe.
 const actor=state.person||state;
 const angleDelta=Math.atan2(Math.sin(actor.heading-cameraAngle),Math.cos(actor.heading-cameraAngle));
 cameraAngle+=angleDelta*(1-Math.exp(-dt*6));
 let range=state.person?4.5:mode==='title'?7.3:6.25+Math.abs(state.v)*.052;
 const yaw=mode==='title'?state.heading-.52:cameraAngle;
 for(let d=1;d<range;d+=.65){
  const x=actor.x-Math.sin(yaw)*d,z=actor.z-Math.cos(yaw)*d;
  if(engine.blocks.some(b=>Math.abs(x-b.x)<b.w/2+.28&&Math.abs(z-b.z)<b.d/2+.28)){range=Math.max(1.1,d-.5);break;}
 }
 const cam={x:actor.x-Math.sin(yaw)*range,y:2.22+range*.065+state.impact*Math.sin(now*.075)*.26,z:actor.z-Math.cos(yaw)*range,angle:yaw,pitch:.17};
 engine.draw(state,traffic(state.time),target(state),cam);requestAnimationFrame(frame);
}
if(engine)requestAnimationFrame(frame);
