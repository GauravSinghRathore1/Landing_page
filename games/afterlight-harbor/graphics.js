import {streets} from './city.js';

const vertex=`
attribute vec3 p,n,c;
attribute float mat;
uniform vec3 eye,origin;
uniform vec2 facing,tilt,rotation;
uniform float aspect,mirror;
varying vec3 world,normal,col;
varying float surface,depth;
void main(){
 world=vec3(p.x*rotation.y+p.z*rotation.x,p.y,-p.x*rotation.x+p.z*rotation.y)+origin;
 world.y*=mirror;
 normal=vec3(n.x*rotation.y+n.z*rotation.x,n.y,-n.x*rotation.x+n.z*rotation.y);
 col=c;surface=mat;
 vec3 d=world-eye;
 float forward=dot(d.xz,facing);
 float side=dot(d.xz,vec2(facing.y,-facing.x));
 depth=forward*tilt.y-d.y*tilt.x;
 gl_Position=vec4(side*1.42/aspect,(d.y*tilt.y+forward*tilt.x)*1.42,depth*1.0005-.24,depth);
}`;
const fragment=`
precision highp float;
varying vec3 world,normal,col;
varying float surface,depth;
uniform vec3 eye,headlamp;
uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(17.31,63.73)))*4375.5453);}
void main(){
 vec3 N=normalize(normal),V=normalize(eye-world);
 float sun=max(0.,dot(N,normalize(vec3(.63,.48,-.5))));
 vec3 color=col*(vec3(.50,.59,.76)+vec3(.76,.48,.28)*sun);
 if(surface>.5&&surface<1.5){
  float along=abs(N.x)>.5?world.z:world.x;
  vec2 uv=vec2(along*.60,world.y*.42);
  vec2 cell=fract(uv);
  float pane=smoothstep(.10,.16,cell.x)*(1.-smoothstep(.83,.91,cell.x))*smoothstep(.19,.25,cell.y)*(1.-smoothstep(.83,.90,cell.y));
  float light=hash(floor(uv)+floor(world.xz*.017)*33.);
  vec3 sky=mix(vec3(.16,.24,.34),vec3(.69,.46,.43),pow(1.-abs(dot(N,V)),2.));
  vec3 glass=mix(sky,mix(vec3(.91,.66,.38),vec3(.66,.84,.86),light),step(.70,light)*.87);
  color=mix(color,glass,pane*clamp((world.y-2.)*.8,0.,1.));
 }else if(surface>1.5&&surface<2.5){
  float grit=hash(floor(world.xz*8.));
  color+=vec3(.027)*grit;
  float slick=smoothstep(.42,.82,sin(world.x*.89+sin(world.z*.6))*sin(world.z*.4)*.5+.5);
  color+=vec3(.17,.105,.09)*slick*pow(1.-abs(V.y),4.);
  vec2 lamp=mod(world.xz-vec2(5.4,7.)+22.,44.)-22.;
  color+=vec3(.28,.18,.085)*exp(-dot(lamp,lamp)*.031);
  vec2 ray=world.xz-headlamp.xy;
  vec2 direction=vec2(sin(headlamp.z),cos(headlamp.z));
  float ahead=dot(ray,direction),side=abs(dot(ray,vec2(direction.y,-direction.x)));
  float beam=smoothstep(1.,3.,ahead)*(1.-smoothstep(4.,20.,ahead))*(1.-smoothstep(.3+ahead*.16,1.2+ahead*.21,abs(side-.66)));
  color+=vec3(.33,.30,.22)*beam;
 }else if(surface>2.5&&surface<3.5){
  float wave=sin(world.z*.78+time*1.8+sin(world.x*.24))+sin(world.x*.63-time*1.1);
  float glint=pow(max(0.,wave*.5),9.);
  color=mix(vec3(.07,.22,.29),vec3(.43,.46,.55),1.-abs(V.y)) +vec3(.79,.50,.32)*glint;
 }else if(surface>3.5&&surface<4.5){color=col*1.35;}
 else if(surface>4.5){color=mix(col,vec3(.65,.58,.58),.09+.39*pow(1.-abs(dot(N,V)),2.));}
 if(surface<1.5 && abs(N.y)<.6){
  float ao=.77+.23*smoothstep(0.,9.,world.y);
  color*=ao;
 }
 color=mix(color,vec3(.63,.56,.61),smoothstep(50.,375.,depth)*.84);
 float opacity=surface>1.5&&surface<2.5?.86:surface>2.5&&surface<3.5?.64:1.;
 gl_FragColor=vec4(color,opacity);
}`;
const skyVertex='attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
const skyFrag=`precision highp float;
varying vec2 uv;uniform vec2 facing,tilt;uniform float aspect;
void main(){
 vec3 v=normalize(vec3(uv.x*aspect/1.42,uv.y/1.42,1.));
 float h=v.y*tilt.y-v.z*tilt.x;
 float f=v.z*tilt.y+v.y*tilt.x;
 vec3 d=vec3(v.x*facing.y+f*facing.x,h,-v.x*facing.x+f*facing.y);
 float disk=dot(d,normalize(vec3(.65,.17,-.72)));
 vec3 color=mix(vec3(.99,.69,.54),vec3(.20,.36,.58),smoothstep(-.02,.6,h));
 float w=sin(d.x*19.+d.z*13.+h*28.+sin(d.z*37.))*sin(h*68.+d.x*7.);
 color+=vec3(.12,.085,.10)*smoothstep(.12,.8,w)*smoothstep(.015,.14,h);
 color+=vec3(.82,.44,.18)*(pow(max(0.,disk),65.)*.62+smoothstep(.999,.99965,disk));
 gl_FragColor=vec4(color,1.);
}`;
function shaderProgram(gl,vs,fs){
 const program=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
  gl.attachShader(program,shader);
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 return program;
}
const swatches={road:[.115,.14,.18],walk:[.45,.45,.48],stone:[.38,.42,.47],dark:[.10,.15,.21],gold:[1,.70,.30],cyan:[.25,.87,.87],white:[.86,.86,.82],green:[.17,.39,.30],metal:[.49,.53,.56],red:[.99,.18,.11],water:[.08,.33,.43],rubber:[.045,.05,.06],glass:[.09,.20,.28],paint:[.09,.29,.44]};
function tri(mesh,a,b,c,color,mat){
 const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;
 for(const pt of [a,b,c])mesh.push(...pt,...n.map(v=>v/len),...(swatches[color]||color),mat);
}
function face(mesh,a,b,c,d,color,mat=0){tri(mesh,a,b,c,color,mat);tri(mesh,a,c,d,color,mat);}
function box(mesh,x,y,z,w,h,d,color,mat=0){
 const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,f=z-d/2,k=z+d/2;
 face(mesh,[l,b,f],[l,t,f],[r,t,f],[r,b,f],color,mat);
 face(mesh,[r,b,k],[r,t,k],[l,t,k],[l,b,k],color,mat);
 face(mesh,[l,b,k],[l,t,k],[l,t,f],[l,b,f],color,mat);
 face(mesh,[r,b,f],[r,t,f],[r,t,k],[r,b,k],color,mat);
 face(mesh,[l,t,f],[l,t,k],[r,t,k],[r,t,f],color,mat===1?0:mat);
}
function tree(mesh,x,z){
 box(mesh,x,1.15,z,.36,2.3,.36,[.27,.21,.19]);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,b=a+Math.PI/4;
  const p=[x+Math.cos(a)*2.1,3.3,z+Math.sin(a)*2.1],q=[x+Math.cos(b)*2.1,3.3,z+Math.sin(b)*2.1];
  tri(mesh,q,p,[x+.35,6,z],[.22,.40+i*.008,.29],0);tri(mesh,p,q,[x,1.65,z],'green',0);
 }
}
function city(){
 let seed=78134;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const m=[],ground=[],blocks=[];
 box(ground,0,-.39,0,293,.72,293,'road',2);box(ground,235,-1.3,0,178,.3,790,'water',3);
 for(let i=0;i<6;i++)for(let j=0;j<6;j++){
  const x=streets[i]+22,z=streets[j]+22;
  box(m,x,.12,z,28,.28,28,'walk');
  const park=(i+j*3)%11===4;
  if(park){box(m,x,.30,z,24,.3,24,'green');for(let k=0;k<6;k++)tree(m,x+(random()-.5)*19,z+(random()-.5)*19);continue;}
  const base=11+random()*15+(i===2||i===3?18:0);
  for(let k=0;k<2;k++){
   const cx=x+(k?6.2:-6.2),cz=z+(random()-.5)*3,w=10+random()*1.5,d=17+random()*5,h=base*(.7+random()*.55);
   blocks.push({x:cx,z:cz,w,d});
   const shade=.24+random()*.22;
   box(m,cx,h/2+.3,cz,w,h,d,[shade,shade+.04,shade+.09],1);
   box(m,cx,h+.6,cz,w+.45,.55,d+.45,'metal');
   box(m,cx,h+1.7,cz,w*.58,2,d*.56,'stone');
   if((i+j+k)%3===0){
    for(let level=4;level<h-2;level+=4.4){
     box(m,cx,level,cz+d*.5+.36,w*.8,.25,.97,'walk');
     box(m,cx,level+.7,cz+d*.5+.76,w*.8,.13,.12,'metal');
    }
   }
   if(h>31)box(m,cx,h+5,cz,.13,7,.13,'metal');
   box(m,cx,2.7,cz-d*.5-.53,w+.3,.34,1.2,k?'cyan':'gold',4);
   box(m,cx,.99,cz-d*.5-.08,w*.74,1.45,.18,'glass',5);
  }
  tree(m,x-11,z+12);
 }
 for(const a of streets)for(let i=-140;i<143;i+=7){
  if(streets.some(b=>Math.abs(b-i)<8))continue;
  box(m,a,.014,i,.12,.026,3.4,'gold');box(m,i,.015,a,3.4,.026,.12,'gold');
 }
 for(const x of streets)for(const z of streets){
  for(let k=-3;k<=3;k++){box(m,x+k*1.45,.032,z-6,.68,.04,2.3,'white');box(m,x+6,.031,z+k*1.45,2.3,.04,.68,'white');}
  box(m,x+7,3,z+7,.16,6,.16,'metal');box(m,x+6.1,5.9,z+7,2,.16,.26,'metal');box(m,x+5.4,5.74,z+7,.9,.12,.4,'gold',4);
 }
 // Quayside rail, navigation lights and harbor cranes.
 for(let z=-141;z<=141;z+=6){box(m,143,1,z,.2,2,.2,'metal');box(m,143,1.8,z,.2,.12,6.1,'metal');}
 for(let i=0;i<5;i++){
  let x=175+i%2*22,z=-110+i*52;
  box(m,x,1,z,20,3,19,'dark');box(m,x,10,z,2.2,19,2.2,'gold');box(m,x-4,19,z,24,.8,1.1,'gold');box(m,x-13,15,z,.09,8,.09,'metal');
 }
 // Distant buildings give the street grid a continuous skyline.
 for(let i=0;i<95;i++){
  const side=i%3,k=(random()-.5)*450,out=162+random()*60;
  const x=side===0?-out:k,z=side===0?k:side===1?out:-out,h=9+random()*47;
  box(m,x,h/2,z,7+random()*12,h,8+random()*13,[.32,.36,.45],1);
 }
 // The suspension span crosses the inlet beyond the ferry terminal.
 box(m,217,9,-108,147,1.4,8,'stone');
 for(const x of [174,251]){
  for(const z of [-112,-104]){
   box(m,x,18,z,2.2,38,1.7,[.66,.29,.24]);
   for(let direction of [-1,1])for(let j=1;j<=31;j++){
    const height=36-22*Math.sin(j/32*1.48);
    box(m,x+direction*j,height,z,1.12,.85,.55,'white');
    if(j%4===0)box(m,x+direction*j,(height+10)/2,z,.15,height-10,.15,'metal');
   }
  }
  box(m,x,34.5,-108,2,1.4,9,'red');
 }
 for(let i=0;i<8;i++){const x=154+random()*25,z=20+i*11;
  box(m,x,-.08,z,3.1,.95,6.9,'white');box(m,x,.76,z+.25,2.4,.93,3.4,'glass',5);
 }
 return {m,ground,blocks};
}
function coupe(paint){
 const m=[];
 function loft(z0,z1,w0,w1,y0,y1,top0,top1,color,mat=0){
  const a=[-w0,y0,z0],b=[w0,y0,z0],c=[-w1,y1,z1],d=[w1,y1,z1];
  const e=[-w0*.92,top0,z0],f=[w0*.92,top0,z0],g=[-w1*.92,top1,z1],h=[w1*.92,top1,z1];
  face(m,a,e,f,b,color,mat);face(m,d,h,g,c,color,mat);face(m,c,g,e,a,color,mat);face(m,b,f,h,d,color,mat);face(m,e,g,h,f,color,mat);
 }
 loft(-2.25,1.35,.9,1.02,.27,.29,.92,.85,paint,5);
 loft(1.35,2.22,1.02,.81,.29,.32,.85,.65,paint,5);
 loft(-1.31,-.67,.85,.72,.88,.9,.95,1.55,'glass',5);
 loft(-.67,.23,.72,.68,.9,.86,1.55,1.53,'glass',5);
 loft(.23,1.01,.68,.84,.86,.84,1.53,.85,'glass',5);
 box(m,0,1.55,-.20,1.34,.07,.90,paint,5);
 for(const side of [-1,1]){
  box(m,side*.73,.83,-2.27,.43,.13,.055,'red',4);
  box(m,side*.61,.63,2.22,.40,.11,.05,'white',4);
  box(m,side*.96,1.13,.37,.27,.14,.24,paint);
  for(const z of [-1.44,1.35]){
   for(let i=0;i<12;i++){
    const a=i*Math.PI/6,b=a+Math.PI/6,r=.42,y=.43;
    const wheel=(x,t,radius)=>[side*x,y+Math.cos(t)*radius,z+Math.sin(t)*radius];
    face(m,wheel(.82,a,r),wheel(1.03,a,r),wheel(1.03,b,r),wheel(.82,b,r),'rubber');
    tri(m,[side*1.035,y,z],wheel(1.035,a,r),wheel(1.035,b,r),'rubber',0);
    tri(m,[side*1.04,y,z],wheel(1.04,a,.245),wheel(1.04,b,.245),i%2?'metal':'dark',0);
   }
  }
 }
 box(m,0,.70,-2.265,1.69,.24,.04,'rubber');
 for(const x of [-.62,.62]){box(m,x,.77,-2.295,.52,.075,.035,'red',4);box(m,x,.65,-2.295,.38,.058,.035,'red',4);}
 box(m,0,.53,-2.29,.42,.14,.03,'white');box(m,0,.31,-2.26,1.7,.15,.06,'dark');
 box(m,0,.055,0,1.93,.02,4.2,[.055,.065,.08]);
 return m;
}
export function renderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});
 if(!gl)throw Error('WebGL is required. Enable hardware acceleration to drive.');
 const world=shaderProgram(gl,vertex,fragment),sky=shaderProgram(gl,skyVertex,skyFrag);
 function locations(program,names){return Object.fromEntries(names.map(k=>[k,gl.getUniformLocation(program,k)]));}
 const u=locations(world,['aspect','facing','tilt','eye','origin','rotation','time','mirror','headlamp']),v=locations(sky,['aspect','facing','tilt']);
 function buffer(data,stride){const handle=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,handle);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {handle,count:data.length/stride};}
 const scene=city(),cityMesh=buffer(scene.m,10),groundMesh=buffer(scene.ground,10),skyMesh=buffer([-1,-1,3,-1,-1,3],2);
 const vehicles=['paint',[.66,.30,.22],[.27,.40,.39],[.56,.54,.51]].map(col=>buffer(coupe(col),10));
 const torso=[],leg=[];
 box(torso,0,1.1,0,.52,.66,.29,[.21,.41,.48]);
 box(torso,0,1.62,0,.29,.33,.27,[.72,.49,.36]);
 box(torso,0,1.80,-.02,.31,.09,.29,'dark');
 for(const side of [-1,1])box(torso,side*.315,1.03,0,.13,.52,.17,[.29,.44,.47]);
 box(leg,0,.47,0,.18,.75,.20,'dark');box(leg,0,.12,.06,.2,.18,.35,'rubber');
 const bodyMesh=buffer(torso,10),legMesh=buffer(leg,10);
 const marker=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,b=a+Math.PI/16;
  const ring=(r,t)=>[r*Math.cos(t),.10,r*Math.sin(t)];
  face(marker,ring(4,a),ring(4,b),ring(3.74,b),ring(3.74,a),'gold',4);}
 for(const x of [-3.8,3.8])box(marker,x,2.8,0,.16,5.6,.16,'gold',4);
 const beacon=buffer(marker,10);
 const attrs=['p','n','c','mat'].map(k=>gl.getAttribLocation(world,k)),skyP=gl.getAttribLocation(sky,'p');
 function drawMesh(mesh,x,y,z,angle){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.handle);
  attrs.forEach((loc,i)=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,i===3?1:3,gl.FLOAT,false,40,i*12);});
  gl.uniform3f(u.origin,x,y,z);gl.uniform2f(u.rotation,Math.sin(angle),Math.cos(angle));gl.drawArrays(gl.TRIANGLES,0,mesh.count);
 }
 function draw(s,cars,destination,cam){
  const ratio=Math.min(window.devicePixelRatio||1,1.6,1280/Math.max(canvas.clientWidth,canvas.clientHeight));
  const w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.useProgram(sky);
  function camera(prog){gl.uniform1f(prog.aspect,w/h);gl.uniform2f(prog.facing,Math.sin(cam.angle),Math.cos(cam.angle));gl.uniform2f(prog.tilt,Math.sin(cam.pitch),Math.cos(cam.pitch));}
  camera(v);attrs.forEach(loc=>gl.disableVertexAttribArray(loc));gl.bindBuffer(gl.ARRAY_BUFFER,skyMesh.handle);gl.enableVertexAttribArray(skyP);gl.vertexAttribPointer(skyP,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,3);gl.disableVertexAttribArray(skyP);
  gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(world);camera(u);gl.uniform3f(u.eye,cam.x,cam.y,cam.z);gl.uniform1f(u.time,s.time);gl.uniform3f(u.headlamp,s.x,s.z,s.heading);
  gl.uniform1f(u.mirror,-1);drawMesh(cityMesh,0,0,0,0);
  gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniform1f(u.mirror,1);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);drawMesh(groundMesh,0,0,0,0);gl.disable(gl.BLEND);
  drawMesh(cityMesh,0,0,0,0);
  for(const car of cars)drawMesh(vehicles[1+car.i%3],car.x,.04,car.z,car.heading);
  if(destination)drawMesh(beacon,destination[0],0,destination[1],s.time*.16);
  drawMesh(vehicles[0],s.x,.04,s.z,s.heading);
  function pedestrian(x,z,heading,step){
   drawMesh(bodyMesh,x,.20,z,heading);
   for(const side of [-1,1]){
    const offset=side*Math.sin(step*2.5)*.18;
    drawMesh(legMesh,x+side*.14*Math.cos(heading)+offset*Math.sin(heading),.17,z-side*.14*Math.sin(heading)+offset*Math.cos(heading),heading);
   }
  }
  if(s.person)pedestrian(s.person.x,s.person.z,s.person.heading,s.person.step);
  for(let i=0;i<8;i++){
   const phase=(s.time*(.85+i*.06)+i*29)%170;
   pedestrian(i%2?140:122.4,phase<85?phase-44:126-phase,phase<85?0:Math.PI,s.time+i);
  }
 }
 return {draw,blocks:scene.blocks};
}
