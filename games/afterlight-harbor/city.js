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
// Distances are in meters, speed in m/s, and tire forces in m/s².
const wheelbase=2.68, tireGrip=7.1;
function footprint(x,z,heading){
 const dx=Math.sin(heading),dz=Math.cos(heading);
 return [-1.18,0,1.18].map(offset=>[x+offset*dx,z+offset*dz]);
}
function overlaps(x,z,heading,blocks,trafficPoints=[]){
 return footprint(x,z,heading).some(([px,pz])=>{
  if(Math.abs(px)>141||Math.abs(pz)>141)return true;
  if(blocks.some(b=>Math.hypot(Math.max(0,Math.abs(px-b.x)-b.w/2),Math.max(0,Math.abs(pz-b.z)-b.d/2))<1.0))return true;
  return trafficPoints.some(([tx,tz])=>(px-tx)**2+(pz-tz)**2<4);
 });
}
export function drive(s,input,dt,blocks,cars){
 s.time+=dt;
 s.impact=Math.max(0,s.impact-dt);
 s.steer+=(input.steer-s.steer)*Math.min(1,7*dt);
 const speed=Math.abs(s.v);
 const requested=Math.tan(s.steer*.51)/wheelbase;
 const cornerGrip=tireGrip*(input.brake?.72:.94);
 const curvature=clamp(requested,-cornerGrip/Math.max(1,speed**2),cornerGrip/Math.max(1,speed**2));
 const lateral=speed**2*curvature;
 // Braking and cornering share the same tire grip.
 const grip=Math.sqrt(Math.max(0,tireGrip**2-lateral**2));
 s.brakeHold=input.brake&&s.v<=.01?(s.brakeHold||0)+dt:0;
 let v;
 if(input.brake){
  v=s.v>0?Math.max(0,s.v-grip*dt):s.brakeHold>.32?Math.max(-5,s.v-2.4*dt):s.v;
 }else if(input.gas){
  const acceleration=Math.min(5.8,grip)*Math.max(.18,1-speed/33);
  v=Math.min(28,s.v+acceleration*dt);
 }else{
  v=Math.sign(s.v)*Math.max(0,speed-(.32+.008*speed**2)*dt);
 }
 const heading=s.heading+(s.v+v)*.5*curvature*dt;
 const yaw=(s.heading+heading)*.5, travel=(v+s.v)*.5*dt;
 const x=s.x+Math.sin(yaw)*travel,z=s.z+Math.cos(yaw)*travel;
 const trafficPoints=cars.flatMap(c=>footprint(c.x,c.z,c.heading||0));
 const blocked=(x,z,h)=>overlaps(x,z,h,blocks,trafficPoints);
 const trafficDepth=(x,z,h)=>Math.max(0,...footprint(x,z,h).flatMap(([px,pz])=>trafficPoints.map(([tx,tz])=>2-Math.hypot(px-tx,pz-tz))));
 if(!blocked(x,z,heading)||!overlaps(x,z,heading,blocks)&&trafficDepth(x,z,heading)<trafficDepth(s.x,s.z,s.heading)){
  Object.assign(s,{x,z,v,heading});
 }else{
  // Stop at the last clear position before contact.
  let fraction=0, upper=1;
  for(let i=0;i<6;i++){
   const mid=(fraction+upper)*.5;
   if(blocked(s.x+(x-s.x)*mid,s.z+(z-s.z)*mid,s.heading+(heading-s.heading)*mid))upper=mid;
   else fraction=mid;
  }
  s.x+=(x-s.x)*fraction;
  s.z+=(z-s.z)*fraction;
  s.heading+=(heading-s.heading)*fraction;
  if(speed>3)s.impact=Math.min(.38,speed*.018);
  s.v=0;
 }
 s.lateralAcceleration=lateral;
 s.wheelSteer=Math.atan(curvature*wheelbase);
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
