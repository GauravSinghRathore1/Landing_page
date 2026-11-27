'use strict';

const canvas = document.getElementById('restaurant');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['bread','heat','clock','cover','headline','instruction','status'].map(id=>[id,document.getElementById(id)]));
const size={w:540,h:540};
const startPoint={x:270,y:479};
const goal={x:442,y:103};
const menus=[{x:128,y:327},{x:423,y:352}];
const tables=[
  {x:82,y:140,w:87,h:60},{x:216,y:122,w:92,h:67},
  {x:110,y:226,w:87,h:54},{x:294,y:235,w:105,h:57},
  {x:210,y:343,w:100,h:55},{x:360,y:150,w:128,h:30}
];
const guards=[
  {x:263,y:300,rx:115,ry:42,phase:0,speed:.76},
  {x:359,y:222,rx:49,ry:75,phase:1.4,speed:.92}
];
const keys=new Set();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
let drag, state, previous=0;
let screen={x:0,y:0,scale:1,w:0,h:0};

function newGame(running=false) {
  state={...startPoint,time:0,heat:0,bread:false,bluff:0,menus:new Set(),running};
  ui.cover.hidden=running;
  ui.status.textContent='';
  updateHud();
}
function updateHud() {
  const left=Math.max(0,Math.ceil(45-state.time));
  ui.clock.textContent='0:'+String(left).padStart(2,'0');
  ui.heat.textContent='Suspicion '+Math.round(state.heat)+'%';
  ui.bread.textContent=state.bread?'Bread stolen':'Bread in kitchen';
}
function end(message) {
  state.running=false;
  ui.headline.textContent=message;
  ui.instruction.textContent='Touch the restaurant or press Space to retry.';
  ui.cover.hidden=false;
  ui.status.textContent=message;
}
function guardAt(guard,clock) {
  const p=clock*guard.speed+guard.phase;
  return {x:guard.x+Math.cos(p)*guard.rx,y:guard.y+Math.sin(p)*guard.ry,facing:Math.atan2(guard.ry*Math.cos(p),-guard.rx*Math.sin(p))};
}
function blocked(x,y) {
  return tables.some(t=>x>t.x-12&&x<t.x+t.w+12&&y>t.y-12&&y<t.y+t.h+12);
}
function behindTable(guard,player) {
  for(let t=.14;t<1;t+=.14) if(blocked(guard.x+(player.x-guard.x)*t,guard.y+(player.y-guard.y)*t))return true;
  return false;
}
function spotted(guard) {
  if(!near(guard,state,state.bread?120:102))return false;
  const angle=Math.atan2(state.y-guard.y,state.x-guard.x)-guard.facing;
  return Math.cos(angle)>Math.cos(.48)&&!behindTable(guard,state);
}
function step(dt) {
  state.time+=dt;
  let x=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
  let y=Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'));
  if(drag) {x+=clamp(drag.dx/36,-1,1);y+=clamp(drag.dy/36,-1,1);}
  const magnitude=Math.max(1,Math.hypot(x,y));
  const speed=state.bread?133:154;
  const nextX=clamp(state.x+x/magnitude*speed*dt,24,size.w-24);
  const nextY=clamp(state.y+y/magnitude*speed*dt,25,size.h-28);
  if(!blocked(nextX,state.y))state.x=nextX;
  if(!blocked(state.x,nextY))state.y=nextY;
  menus.forEach((menu,i)=>{
    if(!state.menus.has(i)&&near(menu,state,23)) {
      state.menus.add(i);
      state.bluff=3;
      state.heat=Math.max(0,state.heat-24);
      ui.status.textContent='The staff buys your food critic act for three seconds.';
    }
  });
  state.bluff=Math.max(0,state.bluff-dt);
  const seen=state.bluff===0&&guards.some(guard=>spotted(guardAt(guard,state.time)));
  state.heat=clamp(state.heat+(seen?(state.bread?36:29):-5)*dt,0,100);
  if(!state.bread&&near(goal,state,21)){state.bread=true;ui.status.textContent='Basket secured. Escape through the lobby.';}
  if(state.heat>=100)end('Busted. They counted six feet.');
  else if(state.time>=45)end('Closing time. The staff found the coat.');
  else if(state.bread&&near(startPoint,state,24))end('Heist complete. Bread for all three.');
  updateHud();
}
function resize() {
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.round(rect.width*dpr);
  canvas.height=Math.round(rect.height*dpr);
  const scale=Math.min(canvas.width/size.w,canvas.height/size.h);
  screen={x:(canvas.width-size.w*scale)/2,y:(canvas.height-size.h*scale)/2,scale};
}
function circle(x,y,r,color) {
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function text(value,x,y,color,font) {
  ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.fillText(value,x,y);
}
function draw() {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#1e1728';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.setTransform(screen.scale,0,0,screen.scale,screen.x,screen.y);
  ctx.fillStyle='#3c2838';ctx.fillRect(11,11,518,518);
  for(let y=12;y<528;y+=27)for(let x=12;x<528;x+=27) {
    if((x+y)%2){ctx.fillStyle='#443042';ctx.fillRect(x,y,26,26);}
  }
  ctx.fillStyle='#234b45';ctx.fillRect(209,443,122,65);
  text('LOBBY EXIT',270,505,'#d4ffcb','bold 16px system-ui');
  ctx.fillStyle='#5d3945';ctx.fillRect(355,51,143,88);
  text('KITCHEN',426,75,'#ffd7a0','bold 17px system-ui');
  tables.forEach(t=>{
    ctx.fillStyle='#251a29';ctx.fillRect(t.x+3,t.y+6,t.w,t.h);
    ctx.fillStyle='#a4705e';ctx.fillRect(t.x,t.y,t.w,t.h);
    ctx.fillStyle='#694858';ctx.fillRect(t.x+5,t.y+5,t.w-10,t.h-10);
    circle(t.x+t.w*.25,t.y+t.h*.5,9,'#eed6c4');
    circle(t.x+t.w*.75,t.y+t.h*.5,9,'#eed6c4');
  });
  for(const guard of guards) {
    const g=guardAt(guard,state.time);
    ctx.fillStyle=state.bluff?'#d5ffc12b':'#ffd07462';
    ctx.beginPath();ctx.moveTo(g.x,g.y);
    ctx.arc(g.x,g.y,state.bread?120:102,g.facing-.48,g.facing+.48);
    ctx.closePath();ctx.fill();
    circle(g.x,g.y,11,'#ffce93');
    circle(g.x+Math.cos(g.facing)*8,g.y+Math.sin(g.facing)*8,4,'#842c4a');
  }
  menus.forEach((menu,i)=>{
    if(!state.menus.has(i)) {circle(menu.x,menu.y,17,'#745984');text('▤',menu.x,menu.y+7,'#fff0b6','bold 22px system-ui');}
  });
  if(!state.bread) text('🥖',goal.x,goal.y+11,'#ffecbb','29px system-ui');
  circle(state.x,state.y,19,state.bluff?'#c8fb98':'#442c55');
  text(state.bread?'🥖':'🦝',state.x,state.y+9,'#fff','26px system-ui');
}
function frame(now) {
  const dt=Math.min(.04,(now-previous)/1000);
  previous=now;
  if(state.running&&dt>0)step(dt);
  draw();
  requestAnimationFrame(frame);
}
canvas.onpointerdown=event=>{
  if(drag||event.button!==0)return;
  if(!state.running)newGame(true);
  canvas.focus({preventScroll:true});
  canvas.setPointerCapture(event.pointerId);
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,dy:0};
};
canvas.onpointermove=event=>{
  if(drag?.id===event.pointerId){
    drag.dx=event.clientX-drag.x;
    drag.dy=event.clientY-drag.y;
  }
};
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{if(drag?.id===event.pointerId)drag=null;});
window.addEventListener('keydown',event=>{
  if(document.activeElement!==canvas&&document.activeElement!==document.body)return;
  if(![' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();
  if(!state.running&&!event.repeat)newGame(true);
  keys.add(event.key);
});
window.addEventListener('keyup',event=>keys.delete(event.key));
window.addEventListener('blur',()=>{drag=null;keys.clear();});
new ResizeObserver(resize).observe(canvas);
newGame();
resize();
requestAnimationFrame(frame);
