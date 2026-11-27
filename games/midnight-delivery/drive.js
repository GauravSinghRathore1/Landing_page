'use strict';

const canvas = document.getElementById('road');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['speed','cake','remaining','overlay','headline','instruction','result'].map(id=>[id,document.getElementById(id)]));
const distance = 1600;
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const bend = z=>Math.sin(z/94)*.52+Math.sin(z/211)*.33;
const keys = new Set();
let width=0, height=0, ratio=1, previous=0, touch=null, state;

function newRace() {
  return { mode:'ready', z:0, speed:0, x:0, target:0, velocity:0, cake:100, time:0,
    traffic:Array.from({length:14},(_, i)=>({ start:145+i*96, lane:[-.54,.48,.02,.63,-.36][i%5], speed:8+i%3, hit:false })) };
}
function start() {
  state=newRace();
  state.mode='running';
  ui.overlay.hidden=true;
  ui.result.textContent='';
}
function finish(message) {
  state.mode='finished';
  ui.headline.textContent=message;
  ui.instruction.textContent='Touch the road or press Space to drive again.';
  ui.overlay.hidden=false;
  ui.result.textContent=message;
}

function resize() {
  const rect=canvas.getBoundingClientRect();
  width=rect.width; height=rect.height;
  ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*ratio);
  canvas.height=Math.round(height*ratio);
  ctx.setTransform(ratio,0,0,ratio,0,0);
}
function update(dt) {
  const s=state;
  const brake=Boolean(touch?.brake||keys.has('ArrowDown')||keys.has('s'));
  const left=keys.has('ArrowLeft')||keys.has('a');
  const right=keys.has('ArrowRight')||keys.has('d');
  if(left||right) s.target=clamp(s.target+((right?1:0)-(left?1:0))*dt*1.55,-1.1,1.1);
  const oldSpeed=s.speed;
  const offroad=Math.abs(s.x)> .9;
  s.speed=clamp(s.speed+(brake?-25:offroad?-16:7)*dt,brake?5:0,42);
  if(offroad&&!brake) s.speed=Math.max(5,s.speed);
  const oldVelocity=s.velocity;
  s.velocity+=(7*(s.target-s.x)-4.6*s.velocity)*dt;
  s.x=clamp(s.x+(s.velocity-bend(s.z)*s.speed/45)*dt,-1.16,1.16);
  const oldZ=s.z;
  s.z+=s.speed*dt;
  s.time+=dt;
  if(offroad) s.cake-=dt*(2+s.speed*.16);
  s.cake-=Math.max(0,Math.abs(s.velocity-oldVelocity)-dt*3)*s.speed*.009;
  for(const car of s.traffic) {
    const lane=car.lane;
    const delta=car.start+car.speed*s.time-s.z;
    if(!car.hit&&delta<8&&delta> -3&&Math.abs(lane-s.x)<.29) {
      car.hit=true;
      s.cake-=9+oldSpeed*.28;
      s.speed*=.55;
      s.target=clamp(s.x+(s.x>=lane?.32:-.32),-1.1,1.1);
    }
  }
  if(oldZ<distance&&s.z>=distance) {
    const win=s.time<52&&s.cake>=35;
    finish(win?'You beat the rival. Cake delivered!':s.cake<35?'The cake didn’t survive delivery.':'Cake delivered. The rival got there first.');
  } else if(s.cake<=0) finish('That cake is frosting now.');
  ui.speed.textContent=Math.round(s.speed*3.6)+' km/h';
  ui.cake.textContent='Cake '+Math.max(0,Math.ceil(s.cake))+'%';
  ui.remaining.textContent=(Math.max(0,distance-s.z)/1000).toFixed(2)+' km';
}

function quad(color,a,b,c,d) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.lineTo(...d);
  ctx.closePath();ctx.fill();
}
function project(relative) {
  const depth=1/(1+relative/40);
  const curve=(bend(state.z+relative)-bend(state.z))*Math.min(1,relative/75);
  return { x:width/2+curve*width*.29-state.x*width*.13*depth, y:height*(.32+.64*depth), w:width*.49*depth, depth };
}
function car(x,y,w,color,player) {
  const h=w*.65;
  ctx.fillStyle='#0b0a19';ctx.fillRect(x-w*.55,y-h*.25,w*1.1,h*.36);
  quad(color,[x-w*.48,y],[x+w*.48,y],[x+w*.37,y-h],[x-w*.37,y-h]);
  ctx.fillStyle=player?'#492f5a':'#29354f';ctx.fillRect(x-w*.3,y-h*.76,w*.6,h*.32);
  ctx.fillStyle='#ff828d';ctx.fillRect(x-w*.4,y-h*.28,w*.16,h*.14);ctx.fillRect(x+w*.24,y-h*.28,w*.16,h*.14);
  if(player){ctx.fillStyle='#ffdc9b';ctx.fillRect(x-w*.16,y-h*.43,w*.32,h*.27);}
}
function band(color,a,b,left,right) {
  quad(color,[a.x+a.w*left,a.y],[a.x+a.w*right,a.y],[b.x+b.w*right,b.y],[b.x+b.w*left,b.y]);
}
function render() {
  const sky=ctx.createLinearGradient(0,0,0,height*.56);
  sky.addColorStop(0,'#121735');sky.addColorStop(.66,'#563448');sky.addColorStop(1,'#171932');
  ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#fbe5a8';ctx.beginPath();ctx.arc(width*.78,height*.15,Math.min(28,width*.06),0,Math.PI*2);ctx.fill();
  for(let i=0;i<18;i++) {
    const x=i*width/17;
    const h=height*(.045+((i*31)%11)*.009);
    const y=height*.34-h;
    ctx.fillStyle=i%2?'#252342':'#1c203d';ctx.fillRect(x,y,width*.07,h);
    ctx.fillStyle='#ffcf8270';ctx.fillRect(x+width*.02,y+8,2,5);
  }
  for(let i=60;i>=0;i--) {
    const near=i*5, a=project(near),b=project(near+5);
    const stripe=Math.floor((state.z+near)/9)%2===0;
    quad(stripe?'#29334a':'#243046',[0,a.y],[width,a.y],[width,b.y],[0,b.y]);
    band(stripe?'#fa9a83':'#efe2bd',a,b,-1,1);
    band(stripe?'#303347':'#34374c',a,b,-.965,.965);
    if(Math.floor((state.z+near)/10)%2===0) for(const lane of [-.32,.32]) band('#c2bfd4',a,b,lane-.012,lane+.012);
    if(Math.abs(state.z+near-distance)<5) for(let j=0;j<10;j++) band(j%2?'#12182b':'#f7ecf4',a,b,-.95+j*.19,-.76+j*.19);
  }
  const visible=state.traffic.map(vehicle=>({...vehicle,rel:vehicle.start+vehicle.speed*state.time-state.z}))
    .concat({rel:distance/52*state.time-state.z,lane:-.2,rival:true})
    .filter(vehicle=>vehicle.rel> -6&&vehicle.rel<277).sort((a,b)=>b.rel-a.rel);
  for(const v of visible) {
    const p=project(v.rel+13);
    car(p.x+p.w*v.lane,p.y,p.w*.25,v.rival?'#a5eb8f':'#70accd',false);
  }
  const road=project(13);
  car(road.x+road.w*state.x,road.y,Math.min(width*.15,102),'#ffaf72',true);
}
function frame(now) {
  const dt=Math.min(.04,(now-previous)/1000);
  previous=now;
  if(state.mode==='running'&&dt>0) update(dt);
  render();
  requestAnimationFrame(frame);
}

canvas.addEventListener('pointerdown',event=>{
  if(touch) return;
  if(state.mode!=='running') start();
  canvas.focus({preventScroll:true});
  canvas.setPointerCapture(event.pointerId);
  touch={id:event.pointerId,x:event.clientX,y:event.clientY,target:state.target,brake:false};
});
canvas.addEventListener('pointermove',event=>{
  if(touch?.id!==event.pointerId) return;
  state.target=clamp(touch.target+(event.clientX-touch.x)/width*3.1,-1.1,1.1);
  touch.brake=event.clientY-touch.y>Math.min(58,height*.12);
});
for(const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type,event=>{
  if(touch?.id===event.pointerId) touch=null;
});
window.addEventListener('keydown',event=>{
  if(document.activeElement!==canvas&&document.activeElement!==document.body) return;
  if(![' ','ArrowLeft','ArrowRight','ArrowDown','a','d','s'].includes(event.key)) return;
  event.preventDefault();
  if(state.mode!=='running'&&!event.repeat) start();
  keys.add(event.key);
});
window.addEventListener('keyup',event=>keys.delete(event.key));
window.addEventListener('blur',()=>{keys.clear();touch=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();touch=null;}});
state=newRace();
new ResizeObserver(resize).observe(canvas);
resize();
requestAnimationFrame(frame);
