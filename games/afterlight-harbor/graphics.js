import {streets} from './city.js';

const vertex=`
attribute vec3 p,n,c;
attribute float mat;
uniform vec3 eye,origin;
uniform vec2 facing,tilt,rotation,lean,spin;
uniform float aspect,mirror;
uniform vec4 dents;
varying vec3 world,normal,col;
varying float surface,depth;
vec3 orient(vec3 v){
 v.yz=mat2(spin.y,spin.x,-spin.x,spin.y)*v.yz;
 v.xy=mat2(lean.y,lean.x,-lean.x,lean.y)*v.xy;
 return vec3(v.x*rotation.y+v.z*rotation.x,v.y,-v.x*rotation.x+v.z*rotation.y);
}
void main(){
 float front=dents.x*smoothstep(.76,2.20,p.z);
 float rear=dents.y*smoothstep(.76,2.20,-p.z);
 float dentSide=(p.x<0.?dents.z:dents.w)*smoothstep(.35,1.,abs(p.x));
 float panel=1.-smoothstep(.98,1.34,p.y);
 vec3 shell=p;
 shell.z+=(rear-front)*.68;
 shell.x-=sign(p.x)*dentSide*.26*panel;
 shell.y+=(front+rear)*(.17+.12*sin(p.x*11.))*panel+dentSide*.10*sin(p.z*9.)*panel;
 vec3 point=orient(shell);
 world=point+origin;
 world.y*=mirror;
 normal=orient(n);normal.y*=mirror;

 col=mix(c,vec3(.17,.15,.14),clamp((front+rear+dentSide)*.60,0.,.66));surface=mat;
 vec3 d=world-eye;
 float forward=dot(d.xz,facing);
 float side=dot(d.xz,vec2(facing.y,-facing.x));
 depth=forward*tilt.y-d.y*tilt.x;
 gl_Position=vec4(side*1.42/aspect,(d.y*tilt.y+forward*tilt.x)*1.42,depth*1.0005-.24,depth);
}`;
// Belfast Sunset (Pure Sky) and Asphalt 04 from Poly Haven, CC0.
// Sample the same panorama for the sky, bodywork, glazing, and harbor.
const atmosphere=`
uniform sampler2D panorama;
vec3 environment(vec3 dir){
 dir=normalize(dir);
 vec2 uv=vec2(.5+atan(dir.x,dir.z)*.15915494,.5-asin(clamp(dir.y,-1.,1.))*.31830989);
 return texture2D(panorama,uv).rgb;
}
`;
const fragment=`
precision highp float;
varying vec3 world,normal,col;
varying float surface,depth;
uniform vec3 eye,headlamp;
uniform sampler2D pavement,shadeMap,shops,districts;
${atmosphere}
uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(17.31,63.73)))*4375.5453);}
void main(){
 vec3 N=normalize(normal),V=normalize(eye-world);
 vec3 lightDir=normalize(vec3(.65,.22,-.72));
 vec3 reflected=reflect(-V,N);
 float sun=max(0.,dot(N,lightDir));
 float fresnel=pow(1.-max(0.,dot(N,V)),4.);
 float groundShade=texture2D(shadeMap,clamp(world.xz/360.+.5,.001,.999)).r;
 float shade=mix(groundShade,1.,smoothstep(1.,16.,world.y));
 vec3 color=col*(vec3(.53,.61,.71)+vec3(.90,.66,.44)*sun*shade);
 float opacity=1.;
 if(surface>.5&&surface<1.5){
  float along=abs(N.x)>.5?world.z:world.x;
  vec2 uv=vec2(along*.56,world.y*.32),cell=fract(uv),id=floor(uv);
  float pane=smoothstep(.07,.11,cell.x)*(1.-smoothstep(.89,.93,cell.x))*smoothstep(.16,.21,cell.y)*(1.-smoothstep(.84,.89,cell.y));
  float light=hash(id+floor((world.x+world.z-along)*.3));
  vec3 env=environment(reflected);
  float neighbor=smoothstep(.1,.15,reflected.y+.17*sin(along*.26)+.12*cos(along*.81));
  vec3 glass=mix(vec3(.085,.13,.16),env*vec3(.62,.69,.73),neighbor);
  float blind=step(cell.y,light*.74)*(.76+.24*cos(cell.y*78.));
  vec3 interior=mix(vec3(.17,.16,.15),vec3(.87,.66,.43),smoothstep(.80,.98,light));
  glass=mix(glass,interior,(.15+.53*blind)*(1.-fresnel));
  color*=.87+.13*step(.045,fract(world.y*.32));
  float facade=hash(vec2(floor((world.x+world.z-along)*.41),1.));
  if(facade>.53){
   vec2 brick=vec2(along*2.25,world.y*5.0);
   brick.x+=.5*mod(floor(brick.y),2.);
   vec2 mortar=abs(fract(brick)-.5);
   float joint=smoothstep(.43,.50,max(mortar.x,mortar.y));
   color=mix(color*vec3(1.35,.87,.68),vec3(.35,.32,.30),joint*.56);
   pane*=smoothstep(.11,.16,cell.x)*(1.-smoothstep(.83,.89,cell.x));
  }
  color=mix(color,glass,pane*smoothstep(2.,3.,world.y));
 }else if(surface>1.5&&surface<2.5){
  vec3 aggregate=texture2D(pavement,world.xz*.24).rgb;
  float pooled=smoothstep(.36,.68,texture2D(pavement,world.xz*.019).r+.08*sin(world.z*.42));
  float lanes=min(abs(mod(world.x+22.,44.)-22.),abs(mod(world.z+22.,44.)-22.));
  float tireTrack=1.-smoothstep(.18,.55,abs(abs(lanes-2.7)-.72));
  float wet=clamp(.16+.57*pooled+.19*tireTrack-.17*aggregate.b,0.,.92);
  color=vec3(.102,.115,.127)*(aggregate.r*1.18+.35)*(.70+.43*shade)*(1.-.28*wet);
  color+=vec3(.045,.040,.035)*smoothstep(.48,.73,aggregate.r);
  opacity=1.-(.035+wet*(.14+.31*fresnel));
  vec2 lamp=mod(world.xz-vec2(5.4,7.)+22.,44.)-22.;
  color+=vec3(.28,.18,.085)*exp(-dot(lamp,lamp)*.031);
  vec2 ray=world.xz-headlamp.xy;
  vec2 direction=vec2(sin(headlamp.z),cos(headlamp.z));
  float ahead=dot(ray,direction),side=abs(dot(ray,vec2(direction.y,-direction.x)));
  float beam=smoothstep(1.,3.,ahead)*(1.-smoothstep(4.,20.,ahead))*(1.-smoothstep(.3+ahead*.16,1.2+ahead*.21,abs(side-.66)));
  color+=vec3(.24,.225,.175)*beam;
  float contact=exp(-pow(side/.99,4.)-pow(ahead/2.42,4.));
  color*=1.-.72*contact;
  opacity=mix(opacity,.99,contact);
 }else if(surface>2.5&&surface<3.5){
  vec2 q=world.xz;
  float a=sin(q.y*1.73+q.x*.53+time*1.29);
  float b=cos(q.x*.89-q.y*.52+time*.67);
  float chop=sin(q.y*4.6+q.x*.7+1.6*b+time*2.7);
  vec3 waveNormal=normalize(vec3(.08*b+.035*chop,1.,.105*a+.045*chop));
  vec3 r=reflect(-V,waveNormal);
  float glint=pow(max(0.,dot(r,lightDir)),135.);
  color=mix(vec3(.075,.19,.205),environment(r)*vec3(.73,.81,.83),.20+.66*fresnel)+vec3(1.,.79,.52)*glint;
  opacity=.65+.17*(1.-fresnel);
 }else if(surface>3.5&&surface<4.5){color=col*1.17;}
 else if(surface>6.5){
  vec3 interior=texture2D(shops,vec2(col.r,(floor(col.b*4.)+clamp(col.g,.003,.997))*.25)).rgb;
  float window=step(.18,col.g)*(1.-step(.90,col.g));
  color=interior*(.80+.24*sun)+environment(reflected)*window*(.07+.22*fresnel);
 }
 else if(surface>4.5){
  // Directional reflections baked at street level in downtown and at the quay.
  vec2 uv=vec2(.5+atan(reflected.x,reflected.z)*.15915494,.5-asin(clamp(reflected.y,-1.,1.))*.31830989);
  uv.y=clamp(uv.y,.003,.997)*.5;
  vec3 downtown=texture2D(districts,uv).rgb;
  vec3 harbor=texture2D(districts,uv+vec2(0.,.5)).rgb;
  vec3 env=mix(downtown,harbor,smoothstep(91.,129.,world.x));
  float spec=pow(max(0.,dot(reflected,lightDir)),95.);
  if(surface<5.5)color=col*(.31+.65*sun)+env*(.13+.61*fresnel)+vec3(.81,.69,.57)*spec;
  else color=mix(vec3(.046,.082,.096),env*vec3(.78,.86,.88),.29+.58*fresnel)+spec*.32;
 }
 if(surface<1.5 && abs(N.y)<.6){
  float ao=.77+.23*smoothstep(0.,9.,world.y);
  color*=ao;
 }
 color=mix(color,vec3(.63,.56,.61),smoothstep(50.,375.,depth)*.84);

 gl_FragColor=vec4(color,opacity);
}`;
const skyVertex='attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
const skyFrag=`precision highp float;
varying vec2 uv;uniform vec2 facing,tilt;uniform float aspect;
${atmosphere}
void main(){
 vec3 v=normalize(vec3(uv.x*aspect/1.42,uv.y/1.42,1.));
 float h=v.y*tilt.y-v.z*tilt.x;
 float f=v.z*tilt.y+v.y*tilt.x;
 vec3 d=vec3(v.x*facing.y+f*facing.x,h,-v.x*facing.x+f*facing.y);
 vec3 color=environment(d);
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
function storefront(mesh,x,z,width,side,id){
 const y=.35,h=2.65;
 // UVs and the atlas row occupy the vertex color channels of this material.
 for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
  mesh.push(x,y+h*(1-v),z+(u-.5)*width*side,side,0,0,u,v,(id+.5)/4,7);
 }
}
function tree(mesh,x,z){
 const bark=[.245,.205,.17];
 rod(mesh,[x,0,z],[x+.10,3.2,z],.19,bark);
 for(let l=0;l<5;l++){
  const t=l*2.40+x*.17;
  const cx=x+Math.cos(t)*(l===4?.18:.94),cz=z+Math.sin(t)*(l===4?.18:.98),cy=l===4?5.3:4.15;
  rod(mesh,[x,2.1,z],[cx,cy,cz],.09,bark);
  const point=(a,b)=>{
   const r=1+.13*Math.sin(a*3+b*2+t);
   return [cx+1.57*r*Math.sin(b)*Math.cos(a),cy+1.42*r*Math.cos(b),cz+1.4*r*Math.sin(b)*Math.sin(a)];
  };
  for(let j=0;j<7;j++)for(let k=0;k<4;k++){
   const a=j*Math.PI*2/7,b=k*Math.PI/4;
   const olive=.9+.18*Math.sin(j+t);
   face(mesh,point(a,b),point(a+Math.PI*2/7,b),point(a+Math.PI*2/7,b+Math.PI/4),point(a,b+Math.PI/4),[.23*olive,.35*olive,.20*olive],0);
  }
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
   const frontage=cz-d*.5;
   box(m,cx,2.72,frontage-.46,w+.2,.19,1.12,'dark');
   box(m,cx,2.59,frontage-.82,w*.85,.045,.11,[.86,.76,.57],4);
   for(const offset of [-.36,-.12,.12,.36])box(m,cx+w*offset,1.4,frontage-.20,.10,2.34,.14,'metal');
   box(m,cx,.34,frontage-.53,w*.87,.12,.85,'stone');
   // Facing doors, floor bands and corner posts break up long street elevations.
   for(const side of [-1,1]){
    const wall=cx+side*(w/2+.035);
    storefront(m,wall+side*.09,cz,d*.78,side,(i+j+k)%4);
    for(let n=-2;n<=2;n++)box(m,wall+side*.075,1.55,cz+n*d*.16,.12,2.83,.105,'metal');
    box(m,wall+side*.18,3.05,cz,.56,.17,d*.85,'dark');
   }
   for(let level=3.2;level<h-.4;level+=6.25)box(m,cx,level,cz,w+.16,.13,d+.16,'stone');
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
  box(m,x,1,z,17,2,15,'stone');
  const ochre=[.48,.34,.22];
  for(const dx of [-6,6])for(const dz of [-5,5])box(m,x+dx,-.15,z+dz,.9,3.4,.9,'stone');
  for(const side of [-1,1]){
   const v=z+side*1.9;
   for(const edge of [-1,1])rod(m,[x+edge*2.5,2,v],[x+edge*1.0,20,v],.20,ochre);
   for(let j=0;j<5;j++)rod(m,[x-1.7,3+j*3.3,v],[x+1.7,6+j*3.3,v],.11,ochre);
   rod(m,[x-15,20,v],[x+10,20,v],.19,ochre);
   rod(m,[x-15,20,v],[x,24,v],.13,ochre);rod(m,[x,24,v],[x+10,20,v],.13,ochre);
  }
  box(m,x+3,20.7,z,4.1,2.4,3.8,'stone');box(m,x+3,21.05,z-1.95,3.4,.9,.1,'glass',6);
  rod(m,[x-13,20,z],[x-13,10,z],.055,'dark');
 }
 // Timber berths, mooring posts, and fenders cast reflections along the quay.
 for(let z=-90;z<=80;z+=34){
  box(m,151,-.10,z,11,.58,2.5,[.34,.28,.235]);
  for(const dx of [147,155])for(const dz of [-1.12,1.12]){
   rod(m,[dx,-2,z+dz],[dx,1.14,z+dz],.21,[.27,.235,.215]);
   rod(m,[dx,.53,z+dz],[dx,.76,z+dz],.22,'white');
  }
 }
 for(let z=-138;z<=136;z+=12){
  box(m,141,.63,z,.85,1.15,.85,'stone');
  box(m,141,1.25,z,.97,.15,.97,'metal');
 }
 for(const x of streets)for(const z of [-88,0,88]){
  const cx=x+5,cz=z+10;
  const cover=[.17,.17,.175];
  for(let j=0;j<12;j++){
   const point=t=>[cx+Math.cos(t)*.48,.035,cz+Math.sin(t)*.48];
   tri(m,[cx,.035,cz],point((j+1)*Math.PI/6),point(j*Math.PI/6),cover,0);
  }
  for(let j=-2;j<=2;j++)box(m,cx,.042,cz+j*.13,.59,.012,.025,'metal');
 }
 // Distant buildings give the street grid a continuous skyline.
 for(let i=0;i<95;i++){
  const side=i%3,k=(random()-.5)*450,out=162+random()*60;
  const x=side===0?-out:k,z=side===0?k:side===1?out:-out,h=9+random()*47;
  box(m,x,h/2,z,7+random()*12,h,8+random()*13,[.32,.36,.45],1);
 }
 // The suspension span crosses the inlet beyond the ferry terminal.
 box(m,217,9,-108,147,1.4,8,'stone');
 for(let i=0;i<12;i++){
  const x=151+i*11.8;
  for(const z of [-112,-104]){
   box(m,x,10.18,z,.15,1.25,.15,'metal');
   box(m,x,10.75,z,12,.12,.12,'metal');
  }
 }
 for(const x of [174,251]){
  box(m,x,.45,-108,6.4,3.6,15,'stone');
  for(const z of [-112,-104]){
   box(m,x,18,z,2.2,38,1.7,[.66,.29,.24]);
   for(let direction of [-1,1])for(let j=1;j<=31;j++){
    const height=36-22*Math.sin(j/32*1.48);
    const prev=36-22*Math.sin((j-1)/32*1.48);
    rod(m,[x+direction*(j-1),prev,z],[x+direction*j,height,z],.18,'stone');
    if(j%3===0)rod(m,[x+direction*j,9.6,z],[x+direction*j,height,z],.065,'metal');
   }
  }
  box(m,x,34.5,-108,2,1.4,9,'red');
 }
 for(let i=0;i<8;i++){const x=154+random()*25,z=20+i*11;
  box(m,x,-.08,z,3.1,.95,6.9,'white');box(m,x,.76,z+.25,2.4,.93,3.4,'glass',5);
 }
 return {m,ground,blocks};
}
// Cross sections run from the rear bumper to the nose. Creases follow the
// shoulder and sill while adjacent sections share normals along the car.
function shell(mesh, sections, material, surface){
 const normals=sections.map(r=>r.map(()=>[0,0,0]));
 const triangles=[];
 for(let z=0;z<sections.length-1;z++)for(let j=0;j<sections[z].length;j++){
  const next=(j+1)%sections[z].length;
  for(const indices of [[[z,j],[z,next],[z+1,next]],[[z,j],[z+1,next],[z+1,j]]]){
   const [a,b,c]=indices.map(([s,k])=>sections[s][k]);
   const u=b.map((v,k)=>v-a[k]),v=c.map((n,k)=>n-a[k]);
   const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   for(const [s,k] of indices)for(let t=0;t<3;t++)normals[s][k][t]+=n[t];
   triangles.push(indices);
  }
 }
 for(const indices of triangles)for(const [s,k] of indices){
  const n=normals[s][k],len=Math.hypot(...n)||1;
  mesh.push(...sections[s][k],...n.map(v=>v/len),...(swatches[material]||material),surface);
 }
 for(const s of [0,sections.length-1]){
  const loop=sections[s],center=loop[0].map((_,axis)=>loop.reduce((a,v)=>a+v[axis],0)/loop.length);
  for(let k=0;k<loop.length;k++){
   const a=loop[k],b=loop[(k+1)%loop.length];
   if(s===0)tri(mesh,center,b,a,material,surface);else tri(mesh,center,a,b,material,surface);
  }
 }
}
function rod(mesh,a,b,r,col,mat=0,sides=6){
 const diff=b.map((v,i)=>v-a[i]),len=Math.hypot(...diff);
 if(!len)return;
 const axis=diff.map(v=>v/len);
 const u=Math.abs(axis[1])>.98?[1,0,0]:[axis[2],0,-axis[0]];
 const d=Math.hypot(...u);for(let i=0;i<3;i++)u[i]/=d;
 const v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];
 const point=(p,t)=>p.map((x,i)=>x+r*(Math.cos(t)*u[i]+Math.sin(t)*v[i]));
 for(let j=0;j<sides;j++){const t=j*2*Math.PI/sides,k=(j+1)*2*Math.PI/sides;face(mesh,point(a,t),point(a,k),point(b,k),point(b,t),col,mat);}
}
function wheelMesh(side){
 const mesh=[],chrome=[.57,.60,.61],trim=[.055,.065,.075];
 for(let j=0;j<24;j++){
    const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
    const wheel=(x,t,r)=>[side*(x-.94),Math.cos(t)*r,Math.sin(t)*r];
    face(mesh,wheel(.84,a,.41),wheel(.84,b,.41),wheel(1.015,b,.41),wheel(1.015,a,.41),'rubber');
    face(mesh,wheel(1.015,a,.41),wheel(1.015,b,.41),wheel(1.04,b,.356),wheel(1.04,a,.356),'rubber');
    face(mesh,wheel(1.04,a,.356),wheel(1.04,b,.356),wheel(1.04,b,.29),wheel(1.04,a,.29),'rubber');
    face(mesh,wheel(1.043,a,.29),wheel(1.043,b,.29),wheel(1.043,b,.268),wheel(1.043,a,.268),chrome,5);
    tri(mesh,[side*.102,0,0],wheel(1.042,a,.268),wheel(1.042,b,.268),trim,0);
    if(j%3===0)face(mesh,wheel(1.049,a,.076),wheel(1.049,b,.076),wheel(1.049,b+.13,.276),wheel(1.049,a+.085,.276),chrome,5);
   }
 return mesh;
}
function coupe(paint,includeWheels=true){
 const mesh=[],chrome=[.57,.60,.61],trim=[.055,.065,.075];
 const data=[[-2.24,.69,.66],[-2.18,.87,.78],[-1.94,.96,.88],[-1.36,1,.94],[-.68,.96,.94],[.56,.96,.88],[1.28,1,.86],[1.82,.94,.73],[2.12,.84,.62],[2.20,.65,.54]];
 const section=([z,w,h])=>[[-.83,.29],[-.99,.39],[-1,h-.14],[-.96,h-.04],[-.80,h+.015],[0,h+.04],[.80,h+.015],[.96,h-.04],[1,h-.14],[.99,.39],[.83,.29],[0,.26]].reverse().map(([x,y])=>[x*w,y,z]);
 shell(mesh,data.map(section),paint,5);
 // Side glazing narrows into a curved roof; the rear hatch has a long rake.
 const roof=[[-1.62,.86,.93,.74],[-1.44,.87,1.035,.78],[-.76,.855,1.48,.65],[-.52,.84,1.54,.61],[-.12,.83,1.55,.61],[.22,.84,1.50,.63],[.92,.85,.98,.77],[1.07,.83,.9,.79]];
 const cabin=roof.map(([z,w,h,tw])=>[[-w,.87,z],[-tw-.045,h-.045,z],[-tw*.72,h+.006,z],[0,h+.025,z],[tw*.72,h+.006,z],[tw+.045,h-.045,z],[w,.87,z],[0,.86,z]].reverse());
 shell(mesh,cabin,'glass',6);
 const crown=roof.slice(2,6).map(([z,w,h,tw])=>[[-tw,h+.004,z],[-tw*.68,h+.020,z],[0,h+.038,z],[tw*.68,h+.020,z],[tw,h+.004,z],[0,h-.02,z]].reverse());
 shell(mesh,crown,paint,5);
 for(const side of [-1,1]){
  for(const [a,b] of [[[-1.57,.90,.84],[-.75,1.47,.69]],[[-.18,.91,.85],[-.18,1.51,.66]],[[1,.9,.84],[.20,1.50,.67]]]){
   rod(mesh,[a[2]*side,a[1],a[0]],[b[2]*side,b[1],b[0]],.032,trim,0);
  }
  rod(mesh,[side*.89,.905,-1.48],[side*.87,.898,1.04],.018,chrome,5);
  box(mesh,side*.992,.404,-.04,.052,.085,1.80,trim);
  box(mesh,side*.977,.78,-.48,.035,.037,.19,chrome,5);
  rod(mesh,[side*.83,1.02,.57],[side*1.02,1.05,.49],.033,trim);
  box(mesh,side*1.035,1.075,.47,.19,.105,.23,paint,5);
  if(includeWheels)for(const z of [-1.33,1.35]){
   const wheel=wheelMesh(side);
   for(let i=0;i<wheel.length;i+=10){wheel[i]+=side*.94;wheel[i+1]+=.443;wheel[i+2]+=z;}
   mesh.push(...wheel);
  }
  // Recessed LED strips wrap around the rear corners.
  box(mesh,side*.54,.688,-2.226,.57,.16,.075,trim);
  for(const h of [.65,.709])rod(mesh,[side*.28,h,-2.270],[side*.79,h+.025,-2.25],.021,[1,.085,.025],4);
  rod(mesh,[side*.79,.736,-2.25],[side*.91,.747,-2.02],.020,'red',4);
  box(mesh,side*.71,.595,2.132,.33,.072,.04,'white',4);
  box(mesh,side*.69,.325,-2.18,.18,.085,.19,'rubber');
 }
 box(mesh,0,.455,-2.256,.44,.122,.015,[.78,.79,.74]);
 for(let j=-2;j<=2;j++)box(mesh,j*.056,.46,-2.266,.024,.055,.01,'dark');
 box(mesh,0,.335,-2.186,1.5,.095,.09,trim);
 return mesh;
}
export function renderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});
 if(!gl)throw Error('WebGL is required. Enable hardware acceleration to drive.');
 const world=shaderProgram(gl,vertex,fragment),sky=shaderProgram(gl,skyVertex,skyFrag);
 function locations(program,names){return Object.fromEntries(names.map(k=>[k,gl.getUniformLocation(program,k)]));}
 const u=locations(world,['aspect','facing','tilt','eye','origin','rotation','lean','spin','dents','time','mirror','headlamp']),v=locations(sky,['aspect','facing','tilt']);
 function texture(unit,file,placeholder,repeat){
  const handle=gl.createTexture();
  function bind(){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,handle);}
  bind();
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([...placeholder,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  const image=new Image();
  image.onload=()=>{
   bind();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
   gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  };
  image.src=new URL(file,import.meta.url).href;
 }
 texture(0,'evening-sky.webp',[155,161,179],false);
 texture(1,'asphalt.webp',[128,128,235],true);
 texture(2,'street-shade.webp',[255,255,255],false);
 texture(3,'shopfronts.webp',[81,74,66],false);
 texture(4,'district-reflections.webp',[90,101,109],false);
 gl.useProgram(world);
 for(const [name,unit] of [['panorama',0],['pavement',1],['shadeMap',2],['shops',3],['districts',4]])gl.uniform1i(gl.getUniformLocation(world,name),unit);
 gl.useProgram(sky);gl.uniform1i(gl.getUniformLocation(sky,'panorama'),0);
 function buffer(data,stride){const handle=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,handle);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {handle,count:data.length/stride};}
 const scene=city(),cityMesh=buffer(scene.m,10),groundMesh=buffer(scene.ground,10),skyMesh=buffer([-1,-1,3,-1,-1,3],2);
 const vehicles=['paint',[.66,.30,.22],[.27,.40,.39],[.56,.54,.51]].map((col,i)=>buffer(coupe(col,i!==0),10));
 const wheels=[-1,1].map(side=>buffer(wheelMesh(side),10));
 const torso=[],leg=[];
 function rounded(mesh,x,y,z,rx,ry,rz,color){
  const at=(a,b)=>[x+rx*Math.cos(a)*Math.sin(b),y+ry*Math.cos(b),z+rz*Math.sin(a)*Math.sin(b)];
  for(let j=0;j<9;j++)for(let k=0;k<6;k++){
   const a=j*Math.PI*2/9,b=k*Math.PI/6;
   face(mesh,at(a,b),at(a+Math.PI*2/9,b),at(a+Math.PI*2/9,b+Math.PI/6),at(a,b+Math.PI/6),color);
  }
 }
 rounded(torso,0,1.10,0,.25,.40,.16,[.20,.28,.32]);
 rounded(torso,0,1.63,0,.14,.186,.137,[.65,.45,.34]);
 rounded(torso,0,1.72,-.016,.144,.108,.137,[.11,.09,.08]);
 for(const side of [-1,1]){
  rod(torso,[side*.19,1.37,0],[side*.265,1.07,-.06],.078,[.22,.29,.32]);
  rod(torso,[side*.265,1.07,-.06],[side*.26,.84,.035],.062,[.24,.31,.34]);
  rounded(torso,side*.26,.82,.035,.055,.068,.053,[.65,.45,.34]);
 }
 rod(leg,[0,.83,0],[0,.47,.015],.10,'dark');rod(leg,[0,.47,.015],[0,.13,-.015],.073,'dark');
 rounded(leg,0,.105,.052,.085,.080,.15,'rubber');
 const bodyMesh=buffer(torso,10),legMesh=buffer(leg,10);
 const marker=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,b=a+Math.PI/16;
  const ring=(r,t)=>[r*Math.cos(t),.10,r*Math.sin(t)];
  face(marker,ring(4,a),ring(4,b),ring(3.74,b),ring(3.74,a),'gold',4);}
 for(const x of [-3.8,3.8])box(marker,x,2.8,0,.16,5.6,.16,'gold',4);
 const beacon=buffer(marker,10);
 const attrs=['p','n','c','mat'].map(k=>gl.getAttribLocation(world,k)),skyP=gl.getAttribLocation(sky,'p');
 function drawMesh(mesh,x,y,z,angle,roll=0,wheelSpin=0,dents=[0,0,0,0]){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.handle);
  attrs.forEach((loc,i)=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,i===3?1:3,gl.FLOAT,false,40,i*12);});
  gl.uniform3f(u.origin,x,y,z);gl.uniform2f(u.rotation,Math.sin(angle),Math.cos(angle));gl.uniform2f(u.lean,Math.sin(roll),Math.cos(roll));gl.uniform2f(u.spin,Math.sin(wheelSpin),Math.cos(wheelSpin));gl.uniform4fv(u.dents,dents);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
 }
 function draw(s,cars,destination,cam){
  const ratio=Math.min(window.devicePixelRatio||1,1.6,1280/Math.max(canvas.clientWidth,canvas.clientHeight));
  const w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.useProgram(sky);
  function camera(prog){gl.uniform1f(prog.aspect,w/h);gl.uniform2f(prog.facing,Math.sin(cam.angle),Math.cos(cam.angle));gl.uniform2f(prog.tilt,Math.sin(cam.pitch),Math.cos(cam.pitch));}
  camera(v);attrs.forEach(loc=>gl.disableVertexAttribArray(loc));gl.bindBuffer(gl.ARRAY_BUFFER,skyMesh.handle);gl.enableVertexAttribArray(skyP);gl.vertexAttribPointer(skyP,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,3);gl.disableVertexAttribArray(skyP);
  gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(world);camera(u);gl.uniform3f(u.eye,cam.x,cam.y,cam.z);gl.uniform1f(u.time,s.time);gl.uniform3f(u.headlamp,s.x,s.z,s.heading);
  function player(){
   drawMesh(vehicles[0],s.x,.04+(s.heave||0),s.z,s.heading,s.roll||0,0,s.damage);
   const sn=Math.sin(s.heading),cs=Math.cos(s.heading);
   for(const [i,side] of [-1,1].entries())for(const axle of [-1.33,1.35]){
    const x=side*.94;
    drawMesh(wheels[i],s.x+x*cs+axle*sn,.477,s.z-x*sn+axle*cs,s.heading+(axle>0?(s.wheelSteer||0):0),0,s.wheelPhase||0);
   }
  }
  gl.uniform1f(u.mirror,-1);drawMesh(cityMesh,0,0,0,0);player();
  gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniform1f(u.mirror,1);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);drawMesh(groundMesh,0,0,0,0);gl.disable(gl.BLEND);
  drawMesh(cityMesh,0,0,0,0);
  for(const car of cars)drawMesh(vehicles[1+car.i%3],car.x,.04,car.z,car.heading);
  if(destination)drawMesh(beacon,destination[0],0,destination[1],s.time*.16);
  player();
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
