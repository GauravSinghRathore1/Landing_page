export const streets=[-132,-88,-44,0,44,88,132];
export const jobs=[
 {name:'The Night Edition',pickup:[132,-44],drop:[44,-88],start:'Pick up the evening papers',finish:'Deliver to the printworks',limit:33},
 {name:'Last Ferry',pickup:[88,-88],drop:[132,44],start:'Meet the harbor courier',finish:'Reach the ferry terminal',limit:28},
 {name:'Skyline Session',pickup:[44,-88],drop:[-88,132],start:'Collect the studio tapes',finish:'Reach the hillside studio',limit:56}
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createRun(){return {x:134,z:8,heading:Math.PI,v:0,steer:0,time:0,job:0,loaded:false,left:0,cleared:0,notice:'',noticeUntil:0,impact:0};}
export const target=s=>s.job<jobs.length?(s.loaded?jobs[s.job].drop:jobs[s.job].pickup):null;
export function traffic(t){
 return streets.flatMap((road,i)=>[0,1].map(side=>{
  const direction=(i+side)%2===0?1:-1;
  const raw=((t*(6+i%3)+i*43+side*82)%548+548)%548;
  const along=(raw<274?raw:548-raw)-137, sign=(raw<274?1:-1)*direction;
  return side?{x:along*direction,z:road+sign*2.6,heading:sign*Math.PI/2,i:i+side*7}:{x:road-sign*2.6,z:along*direction,heading:sign>0?0:Math.PI,i:i+side*7};
 }));
}
export function drive(s,input,dt,blocks,cars){
 s.time+=dt;s.impact=Math.max(0,s.impact-dt);
 s.steer+=(input.steer-s.steer)*Math.min(1,7*dt);
 const accel=input.brake?(s.v>.3?-24:-5):input.gas?10:s.v>0?-2.9:3;
 let v=clamp(s.v+accel*dt,-6,25);
 if(!input.gas&&!input.brake&&v*s.v<0)v=0;
 s.heading+=s.steer*clamp(v/6,-1,1)*1.48/(1+Math.abs(v)*.018)*dt;
 const x=s.x+Math.sin(s.heading)*v*dt,z=s.z+Math.cos(s.heading)*v*dt;
 const solid=Math.abs(x)>142||Math.abs(z)>142||blocks.some(b=>Math.abs(x-b.x)<b.w/2+1.15&&Math.abs(z-b.z)<b.d/2+1.65);
 const hit=cars.some(c=>Math.hypot(x-c.x,z-c.z)<2.85&&Math.hypot(x-c.x,z-c.z)<Math.hypot(s.x-c.x,s.z-c.z));
 if(solid||hit){if(Math.abs(v)>6)s.impact=.35;s.v=-v*.18;}else{Object.assign(s,{x,z,v});}
 if(s.job>=jobs.length)return;
 const job=jobs[s.job],to=target(s);
 if(s.loaded){s.left-=dt;if(s.left<=0){s.loaded=false;s.notice='Time expired. Return to pickup to retry.';s.noticeUntil=s.time+3;return;}}
 if(Math.hypot(s.x-to[0],s.z-to[1])<5){
  if(!s.loaded){s.loaded=true;s.left=job.limit;s.notice='Cargo aboard';}
  else{s.loaded=false;s.job++;s.cleared++;s.notice='Delivery complete';}
  s.noticeUntil=s.time+2;
 }
}

export function walk(person,input,dt,blocks){
 person.heading+=input.steer*dt*2.45;
 const speed=input.brake?-2.1:input.gas?4.8:0;
 const x=clamp(person.x+Math.sin(person.heading)*speed*dt,-142,142);
 const z=clamp(person.z+Math.cos(person.heading)*speed*dt,-142,142);
 const free=(x,z)=>!blocks.some(b=>Math.abs(x-b.x)<b.w/2+.36&&Math.abs(z-b.z)<b.d/2+.36);
 if(free(x,person.z))person.x=x;
 if(free(person.x,z))person.z=z;
 person.step+=Math.abs(speed)*dt;
}
