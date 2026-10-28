/* ------------------------------ ROLE GEAR ------------------------------ */
/* every team room gets kit that matches what the person actually does,
   instead of the same sofa in all nine of them */
function rug(g,x,z,col,w,d){
  B(g,w||3.2,0.05,d||2.6,new THREE.MeshLambertMaterial({color:col}),x,0.04,z,false,false);
}
function plant(g,x,z){
  Cyl(g,.34,.42,0.6,10,M.trim,x,0.3,z,false);
  B(g,0.5,1.5,0.5,new THREE.MeshLambertMaterial({color:0x6FAF7E}),x,1.32,z,false,true);
  B(g,0.9,0.5,0.34,new THREE.MeshLambertMaterial({color:0x6FAF7E}),x,1.85,z,false,true);
}
/* kishori: a bench of coded nodes wired together */
function clusterBench(g,acc,x,z){
  rug(g,x,z+0.4,0xCBD6E0,4.0,3.0);
  B(g,3.4,0.18,1.8,M.trim,x,1.0,z,false,true);
  B(g,0.16,1.0,1.6,M.metal,x-1.5,0.5,z,false,true);
  B(g,0.16,1.0,1.6,M.metal,x+1.5,0.5,z,false,true);
  const leds=[];
  for(let i=0;i<6;i++){
    const nx=x-1.25+(i%3)*1.25, nz=z-0.4+Math.floor(i/3)*0.8;
    B(g,0.5,0.32,0.5,M.dark,nx,1.25,nz,false,true);
    leds.push(B(g,0.16,0.05,0.16,new THREE.MeshLambertMaterial({color:acc}),nx,1.44,nz,false,false));
  }
  anims.push(t=>{ leds.forEach((n,i)=> n.visible=Math.sin(t*3.2+i*1.1)>-0.35); });
}
/* kent: a table people actually sit around */
function meetTable(g,acc,x,z){
  rug(g,x,z,0xCBD6E0,5.4,5.0);
  Cyl(g,1.45,1.45,0.16,20,M.wood,x,1.02,z,false);
  Cyl(g,.2,.34,1.0,12,M.metal,x,0.5,z,false);
  Cyl(g,1.0,1.0,0.1,16,M.trim,x,0.07,z,false);
  const seat=new THREE.MeshLambertMaterial({color:0x8B93A0});
  [0,Math.PI/2,Math.PI,-Math.PI/2].forEach(an=>{
    const sx=x+Math.cos(an)*2.35, sz=z+Math.sin(an)*2.35;
    Cyl(g,.42,.42,0.13,12,seat,sx,0.63,sz,false);
    Cyl(g,.1,.1,0.58,8,M.metal,sx,0.3,sz,false);
  });
  const cup=new THREE.MeshLambertMaterial({color:0xFFFBFB});
  [[-0.62,-0.42],[0.6,0.36],[0.08,0.72]].forEach(p=> Cyl(g,.15,.12,0.28,10,cup,x+p[0],1.24,z+p[1],false));
  B(g,0.9,0.04,0.62,new THREE.MeshLambertMaterial({color:acc}),x-0.3,1.13,z-0.5,false,false);
}
/* lewej: release cadence, so clocks and paper */
function clockWall(g,acc,x,y,z){
  const hands=[];
  for(let i=0;i<4;i++){
    const cx=x-2.55+i*1.7;
    const rim=Cyl(g,.5,.5,0.14,20,M.dark,cx,y,z,false); rim.rotation.x=Math.PI/2;
    const fc=Cyl(g,.42,.42,0.06,20,new THREE.MeshLambertMaterial({color:0xF6F4EF}),cx,y,z+0.07,false); fc.rotation.x=Math.PI/2;
    const hd=B(g,0.05,0.3,0.04,new THREE.MeshLambertMaterial({color:acc}),cx,y+0.15,z+0.12,false,false);
    hands.push({m:hd,cx:cx,cy:y,z:z+0.12,off:i*1.7});
  }
  anims.push(t=>{ hands.forEach(h=>{ const a=t*0.5+h.off;
    h.m.position.set(h.cx+Math.sin(a)*0.15, h.cy+Math.cos(a)*0.15, h.z);
    h.m.rotation.z=-a; }); });
}
function printer(g,acc,x,z){
  rug(g,x,z+0.3,0xCBD6E0,3.6,2.6);
  B(g,1.8,0.75,1.2,M.trim,x,1.5,z,false,true);
  B(g,1.6,1.1,1.05,M.dark,x,0.55,z,false,true);
  B(g,1.5,0.05,0.85,new THREE.MeshLambertMaterial({color:0xFFFBFB}),x,1.9,z+0.16,false,false);
  const led=B(g,0.4,0.06,0.3,new THREE.MeshLambertMaterial({color:acc}),x-0.55,1.9,z+0.52,false,false);
  const paper=new THREE.MeshLambertMaterial({color:0xFFFBFB});
  for(let i=0;i<4;i++) B(g,1.05,0.12,0.78,paper,x+1.7,0.07+i*0.14,z-0.1,false,true);
  anims.push(t=>{ led.visible=Math.sin(t*2.6)>-0.2; });
}
/* eli: the story gets shot somewhere */
function studioRig(g,acc,x,z,ry){
  const s=new THREE.Group(); s.position.set(x,0,z); s.rotation.y=ry||0; g.add(s);
  B(s,3.4,0.2,0.2,M.dark,0,3.85,-0.9,false,true);
  B(s,3.05,3.5,0.07,new THREE.MeshLambertMaterial({color:0xF6F4EF}),0,2.05,-0.87,false,false);
  B(s,3.05,0.06,1.25,new THREE.MeshLambertMaterial({color:0xF6F4EF}),0,0.2,-0.22,false,false);
  Cyl(s,.07,.1,3.8,8,M.metal,-1.62,1.9,-0.9,false);
  Cyl(s,.07,.1,3.8,8,M.metal, 1.62,1.9,-0.9,false);
  const tz=2.15;
  [[-0.32,0.22],[0.32,0.22],[0,-0.38]].forEach(p=>{
    const l=Cyl(s,.04,.06,1.6,8,M.metal,p[0],0.8,tz+p[1],false);
    l.rotation.x = p[1]>0 ? -0.16 : 0.22;
  });
  B(s,0.6,0.42,0.68,M.dark,0,1.76,tz,false,true);
  const lens=Cyl(s,.16,.19,0.34,12,M.dark,0,1.76,tz-0.48,false); lens.rotation.x=Math.PI/2;
  const rec=B(s,0.15,0.08,0.08,new THREE.MeshLambertMaterial({color:0xE2483A}),0,2.02,tz-0.4,false,false);
  Cyl(s,.07,.12,2.1,8,M.metal,1.95,1.05,1.35,false);
  const sb=B(s,1.05,1.05,0.2,new THREE.MeshLambertMaterial({color:0xFFF6E2,emissive:0xFFE0A8}),1.95,2.4,1.35,false,true);
  sb.rotation.y=-0.6;
  anims.push(t=>{ rec.visible=Math.sin(t*3)>-0.1; });
}
/* jeffrey: the AMA actually needs a booth */
function onAirDesk(g,acc,x,z){
  rug(g,x,z+0.5,0xCBD6E0,4.6,3.2);
  B(g,3.8,0.18,1.6,M.wood,x,1.05,z,false,true);
  B(g,0.16,1.0,1.4,M.metal,x-1.7,0.5,z,false,true);
  B(g,0.16,1.0,1.4,M.metal,x+1.7,0.5,z,false,true);
  [-1.05,1.05].forEach(sx=>{
    Cyl(g,.28,.32,0.08,12,M.dark,x+sx,1.18,z,false);
    const arm=Cyl(g,.05,.05,0.95,8,M.metal,x+sx,1.62,z+0.14,false); arm.rotation.x=0.42;
    const mic=Cyl(g,.13,.13,0.32,10,M.dark,x+sx,2.05,z+0.42,false); mic.rotation.x=1.15;
  });
  B(g,0.9,0.1,0.62,M.dark,x,1.2,z-0.5,false,true);
  const faders=[];
  for(let i=0;i<6;i++) faders.push(B(g,0.09,0.05,0.1,new THREE.MeshLambertMaterial({color:acc}),x-0.36+i*0.14,1.27,z-0.5,false,false));
  B(g,2.1,0.62,0.16,M.dark,x,3.5,z-1.35,false,true);
  const sign=Plane(g,1.92,0.48,new THREE.MeshBasicMaterial({map:tagTexture('ON AIR','#E2483A'),transparent:true,toneMapped:false}),x,3.5,z-1.26,0,0);
  anims.push(t=>{
    sign.visible=Math.sin(t*1.9)>-0.45;
    faders.forEach((f,i)=> f.position.z=z-0.5+Math.sin(t*2.2+i)*0.12);
  });
}
/* chandler: priorities you can look down on */
function planTable(g,acc,x,z){
  rug(g,x,z,0xCBD6E0,4.8,3.8);
  B(g,3.8,0.2,2.6,M.wood,x,1.0,z,false,true);
  [[-1.7,-1.1],[1.7,-1.1],[-1.7,1.1],[1.7,1.1]].forEach(p=> Cyl(g,.1,.1,1.0,8,M.metal,x+p[0],0.5,z+p[1],false));
  const bars=[];
  for(let i=0;i<12;i++){
    const bx=x-1.5+(i%4)*1.0, bz=z-0.8+Math.floor(i/4)*0.8;
    bars.push(B(g,0.48,0.9,0.48,new THREE.MeshLambertMaterial({color:(i%3)? 0xD3DBE2 : acc}),bx,1.55,bz,false,true));
  }
  anims.push(t=>{ bars.forEach((b,i)=>{ const k=0.45+(Math.sin(t*0.9+i*0.6)+1)*0.55;
    b.scale.y=k; b.position.y=1.1+0.45*k; }); });
}
/* nancy: a theorist reads and writes, she does not need two monitors */
function writingDesk(g,acc,x,z){
  B(g,3.2,0.18,1.5,M.wood,x,1.05,z,false,true);
  B(g,0.16,1.0,1.3,M.wood,x-1.4,0.5,z,false,true);
  B(g,0.16,1.0,1.3,M.wood,x+1.4,0.5,z,false,true);
  const paper=new THREE.MeshLambertMaterial({color:0xFFFBFB});
  for(let i=0;i<5;i++) B(g,0.86,0.03,0.62,paper,x-0.7+((i*13)%3)*0.06,1.16+i*0.035,z+((i*7)%3)*0.05,false,false);
  B(g,0.62,0.03,0.46,new THREE.MeshLambertMaterial({color:acc}),x+0.9,1.16,z-0.2,false,false);
  Cyl(g,.14,.14,0.28,10,M.dark,x+1.05,1.28,z+0.4,false);
  const pen=Cyl(g,.03,.03,0.42,6,new THREE.MeshLambertMaterial({color:acc}),x+1.05,1.55,z+0.4,false); pen.rotation.z=0.24;
  Cyl(g,.32,.36,0.1,12,M.dark,x+2.2,0.06,z-0.4,false);
  Cyl(g,.05,.05,2.3,8,M.metal,x+2.2,1.2,z-0.4,false);
  Cyl(g,.4,.26,0.55,12,new THREE.MeshLambertMaterial({color:0xFFF3E2,emissive:0xFFE2B0}),x+2.2,2.55,z-0.4,false);
}
function readingNook(g,acc,x,z){
  rug(g,x,z+0.2,0xCBD6E0,3.8,3.0);
  B(g,1.5,0.44,1.4,M.fabric,x,0.56,z,false,true);
  B(g,1.5,0.98,0.26,M.fabric,x,1.16,z-0.6,false,true);
  B(g,0.24,0.58,1.4,M.fabric,x-0.63,0.96,z,false,true);
  B(g,0.24,0.58,1.4,M.fabric,x+0.63,0.96,z,false,true);
  const cols=[acc,0x9DB0C2,0x33363C,0xFEA158,0xD3DBE2];
  for(let i=0;i<5;i++) B(g,0.72,0.13,0.5,new THREE.MeshLambertMaterial({color:cols[i]}),x+1.5,0.1+i*0.14,z+0.7,false,true);
}
/* sriram: instruments, not office software */
function labBench(g,acc,x,z){
  rug(g,x,z+0.4,0xCBD6E0,4.2,3.0);
  B(g,3.8,0.18,1.6,M.trim,x,1.05,z,false,true);
  B(g,0.16,1.0,1.4,M.metal,x-1.7,0.5,z,false,true);
  B(g,0.16,1.0,1.4,M.metal,x+1.7,0.5,z,false,true);
  B(g,1.9,1.15,0.95,M.dark,x-0.75,1.72,z-0.1,false,true);
  B(g,1.6,0.85,0.06,new THREE.MeshLambertMaterial({color:0x11151B}),x-0.75,1.78,z+0.4,false,false);
  const trace=[];
  for(let i=0;i<14;i++) trace.push(B(g,0.09,0.09,0.03,new THREE.MeshLambertMaterial({color:acc}),x-1.45+i*0.1,1.78,z+0.44,false,false));
  B(g,1.2,0.5,0.8,M.trim,x+1.05,1.4,z-0.1,false,true);
  const knobs=[];
  for(let i=0;i<3;i++) knobs.push(Cyl(g,.11,.11,0.08,10,M.dark,x+0.7+i*0.34,1.66,z-0.1,false));
  anims.push(t=>{
    trace.forEach((p,i)=> p.position.y=1.78+Math.sin(t*3.4+i*0.62)*0.26);
    knobs.forEach((k,i)=> k.rotation.y=Math.sin(t*0.7+i)*1.2);
  });
}
function anechoic(g,acc,x,y,z){
  const w=new THREE.MeshLambertMaterial({color:0xB6C0CB});
  for(let i=0;i<5;i++) for(let j=0;j<3;j++){
    const c=new THREE.Mesh(new THREE.ConeGeometry(0.24,0.55,4),w);
    c.position.set(x-1.16+i*0.58, y-0.58+j*0.58, z+0.3);
    c.rotation.x=Math.PI/2; g.add(c);
  }
  B(g,3.0,2.0,0.14,M.dark,x,y,z,false,true);
  B(g,3.15,0.1,0.18,new THREE.MeshLambertMaterial({color:acc}),x,y-1.06,z,false,false);
}
function shelf(g,acc,x,z,ry){
  const s=new THREE.Group(); s.position.set(x,0,z); s.rotation.y=ry||0; g.add(s);
  B(s,2.9,3.4,0.1,new THREE.MeshLambertMaterial({color:0xE7ECF1}),0,1.8,-0.3,false,true);
  for(let i=0;i<4;i++){
    B(s,2.8,0.12,0.55,M.trim,0,0.75+i*0.75,0,false,false);
    for(let k=0;k<7;k++){
      const hh=0.34+((k*7+i*3)%5)*0.04;
      B(s,0.17,hh,0.44,new THREE.MeshLambertMaterial({color:[0xAEBBC9,0x9DB0C2,acc,0x33363C][(k+i)%4]}),-1.2+k*0.4,0.81+i*0.75+hh/2,0,false,false);
    }
  }
}
const ROOM = {
  muriel(g,acc,ez){
    const accM=new THREE.MeshLambertMaterial({color:acc});
    B(g,13.5,0.5,4.9,M.trim,0,0.25,ez-2.45,false,true);
    B(g,13.7,0.14,0.2,accM,0,0.56,ez-0.02,false,false);
    B(g,8.6,5.0,0.32,M.dark,0,4.9,ez-4.55,false,true);
    regBoard(Plane(g,7.9,4.55,new THREE.MeshBasicMaterial({map:boardTexture(bt('netcode'),hx(acc)),transparent:true,toneMapped:false}),0,4.9,ez-4.36,0,0),'netcode',hx(acc));
    B(g,1.4,1.05,0.8,M.wood,-1.7,1.02,ez-1.95,false,true);
    B(g,1.6,0.1,0.92,M.dark,-1.7,1.6,ez-1.95,false,true);
    B(g,1.2,0.05,0.5,accM,-1.7,1.67,ez-1.86,false,false);
    Cyl(g,.04,.04,0.6,6,M.metal,-1.7,1.92,ez-2.12,false);
    B(g,0.14,0.14,0.14,M.dark,-1.7,2.24,ez-2.12,false,false);
    [-3.8,3.8].forEach(sx=>{
      Cyl(g,.1,.1,1.2,8,M.dark,sx,7.3,ez-2.7,false);
      Cyl(g,.36,.22,0.52,10,M.dark,sx,6.55,ez-2.7,false);
      B(g,0.42,0.1,0.42,new THREE.MeshLambertMaterial({color:0xFFF3E2}),sx,6.28,ez-2.7,false,false);
    });
    const chairM=new THREE.MeshLambertMaterial({color:0x8B93A0});
    const rows=[ez+2.4,ez+3.9,ez+5.4], xs=[-4.6,-2.3,0,2.3,4.6];
    rows.forEach(rz=>xs.forEach(cx=>{
      B(g,0.74,0.1,0.74,chairM,cx,0.5,rz,false,true);
      B(g,0.74,0.8,0.12,chairM,cx,0.95,rz+0.33,false,true);
      Cyl(g,.06,.06,0.46,6,M.metal,cx,0.25,rz,false);
    }));
    const skinC=[0xE0BA92,0xA9744B,0xEBD3B6,0xC29168,0xD1A176];
    const shC=[0x51B1FE,0x9DB0C2,0xFEA158,0x64E27F,0x33363C];
    [[0,1],[1,3],[2,0],[2,4],[1,0]].forEach((sp,i)=>{
      const cx=xs[sp[1]], rz=rows[sp[0]];
      B(g,0.56,0.62,0.34,new THREE.MeshLambertMaterial({color:shC[i]}),cx,0.93,rz,false,true);
      B(g,0.46,0.46,0.44,new THREE.MeshLambertMaterial({color:skinC[i]}),cx,1.47,rz,false,true);
      B(g,0.5,0.12,0.48,new THREE.MeshLambertMaterial({color:0x33363C}),cx,1.71,rz,false,false);
    });
    const pk=[];
    for(let i=0;i<7;i++) pk.push(B(g,.4,.4,.4,accM,0,6.6,ez,false,true));
    anims.push(t=>{ pk.forEach((q,i)=>{ const a2=t*0.45+i/7*Math.PI*2;
      q.position.x=Math.cos(a2)*3.4; q.position.z=ez-3.0+Math.sin(a2)*1.1;
      q.position.y=6.6+Math.sin(t*1.4+i)*0.35; q.rotation.y=t+i; }); });
  },
  kishori(g,acc,ez){
    desk(g,acc,-4.0,ez+1.6,[['CLUSTER','nodes: 40','sync: ok'],['LATENCY','p50 150ms','p99 stable']]);
    clusterBench(g,acc,4.3,ez+2.2); plant(g,7.6,ez+4.4);
    B(g,1.8,4.4,1.3,M.dark,5.2,2.2,ez-2.8,false,true);
    const li=[];
    for(let i=0;i<10;i++) li.push(B(g,.14,.14,.07,new THREE.MeshLambertMaterial({color:acc}),4.6+(i%2)*0.6,0.8+Math.floor(i/2)*0.78,ez-2.13,false,false));
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('distr'),hx(acc)),transparent:true,toneMapped:false}),-1.4,3.7,ez-3.6,0,0),'distr',hx(acc));
    anims.push(t=>{ li.forEach((l,i)=> l.visible=Math.sin(t*4+i*1.3)>-0.2); });
  },
  kent(g,acc,ez){
    desk(g,acc,-4.0,ez+1.6,[['ECOSYSTEM','partners: 40','pipeline: open'],['GROWTH','waitlist','validators']]);
    meetTable(g,acc,4.2,ez+3.0); plant(g,-7.6,ez+4.4);
    const gl=new THREE.Mesh(new THREE.SphereGeometry(1.6,18,12),new THREE.MeshPhongMaterial({color:0xD3DBE2,shininess:60}));
    gl.position.set(5.0,2.8,ez-2.6); g.add(gl);
    const wi=new THREE.Mesh(new THREE.SphereGeometry(1.66,14,10),new THREE.MeshBasicMaterial({color:acc,wireframe:true}));
    wi.position.copy(gl.position); g.add(wi);
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('adopt'),hx(acc)),transparent:true,toneMapped:false}),-1.4,3.7,ez-3.6,0,0),'adopt',hx(acc));
    anims.push(t=>{ gl.rotation.y=t*0.3; wi.rotation.y=t*0.3; });
  },
  lewej(g,acc,ez){
    desk(g,acc,-4.0,ez+1.6,[['RELEASE','v0.9 rc','cadence 5x'],['PROGRAM','deps tracked','risks: none']]);
    printer(g,acc,4.6,ez+2.6); clockWall(g,acc,-1.9,6.4,ez-4.45);
    B(g,6.6,3.8,0.22,new THREE.MeshLambertMaterial({color:0xF4F2ED}),4.8,3.7,ez-2.9,false,true);
    const cols=[-2.1,0,2.1], notes=[];
    for(let i=0;i<9;i++){
      const m=B(g,0.66,0.48,0.07,new THREE.MeshLambertMaterial({color:[acc,0xFEA158,0x64E27F][i%3]}),
        4.8+cols[i%3],4.6-Math.floor(i/3)*0.8,ez-2.77,false,false);
      notes.push({m:m,i:i});
    }
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('rel'),hx(acc)),transparent:true,toneMapped:false}),-1.2,3.7,ez-3.6,0,0),'rel',hx(acc));
    anims.push(t=>{
      notes.forEach(n=>{ const st=Math.floor((t*0.3+n.i*0.11)%3); n.m.position.x=4.8+cols[st]; });
    });
  },
  eli(g,acc,ez){
    desk(g,acc,-4.2,ez+1.6,[['EDIT','cut 03','colour pass']]);
    studioRig(g,acc,5.3,ez+1.4,-0.5);
    const ps=[];
    for(let i=0;i<3;i++){
      B(g,2.3,2.9,0.16,M.dark,1.6+i*2.75,5.0,ez-2.9,false,true);
      ps.push(Plane(g,2.15,2.7,new THREE.MeshBasicMaterial({map:boardTexture([['SCALE','ANY','CHAIN'][i],['any chain','permissionless','transmit less'][i]],hx(acc)),transparent:true,toneMapped:false}),1.6+i*2.75,5.0,ez-2.8,0,0));
    }
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('story'),hx(acc)),transparent:true,toneMapped:false}),-2.6,3.7,ez-3.6,0,0),'story',hx(acc));
    anims.push(t=>{ ps.forEach((m,i)=>{ const on=Math.floor(t*0.5)%3===i; m.position.z=ez-2.8+(on?0.1:0); m.scale.setScalar(on?1.05:1); }); });
  },
  jeffrey(g,acc,ez){
    onAirDesk(g,acc,4.3,ez+2.0);
    B(g,6.4,3.4,0.2,new THREE.MeshLambertMaterial({color:0xF4F2ED}),4.4,4.0,ez-2.9,false,true);
    const dots=[];
    for(let i=0;i<18;i++){
      dots.push(B(g,0.42,0.42,0.07,new THREE.MeshLambertMaterial({color:i===7?0xE8B23A:0xD3DBE2}),
        4.4-2.55+(i%6)*1.02, 5.0-Math.floor(i/6)*0.9, ez-2.77,false,false));
    }
    // a small easter egg poster, title only, tucked into the corner
    B(g,1.75,1.12,0.1,M.dark,-3.4,1.42,ez-2.9,false,true);
    Plane(g,1.62,1.02,new THREE.MeshBasicMaterial({map:boardTexture(['TREASURE HUNT'],'#E8B23A'),transparent:true,toneMapped:false}),-3.4,1.42,ez-2.84,0,0);
    B(g,1.5,1.5,0.14,M.dark,-6.8,1.25,ez-4.5,false,true);
    const av=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),
      new THREE.MeshBasicMaterial({map:photoTex(JEFE_AV)}));
    av.position.set(-6.8,1.25,ez-4.42); g.add(av);
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('commb'),hx(acc)),transparent:true,toneMapped:false}),-1.6,3.9,ez-3.6,0,0),'commb',hx(acc));
    anims.push(t=>{ dots.forEach((d,i)=>{ if(i===7){ d.material.color.setHex(0xE8B23A); d.position.z=ez-2.77+Math.abs(Math.sin(t*1.3))*0.05; return; } const k=(Math.sin(t*1.7-i*0.5)+1)/2; d.material.color.setHex(k>0.72?acc:0xD3DBE2); }); });
  },
  chandler(g,acc,ez){
    desk(g,acc,-4.0,ez+1.6,[['STRATEGY','priorities set','next: mainnet'],['OPERATIONS','throughput','tracked']]);
    planTable(g,acc,4.4,ez+2.6);
    B(g,7.0,3.6,0.2,new THREE.MeshLambertMaterial({color:0xF6F4EF}),4.6,3.9,ez-2.9,false,true);
    B(g,5.6,0.1,0.06,new THREE.MeshLambertMaterial({color:acc}),4.6,3.4,ez-2.78,false,false);
    const ms=[];
    for(let i=0;i<4;i++) ms.push(B(g,0.5,0.5,0.09,new THREE.MeshLambertMaterial({color:0xD3DBE2}),
      4.6-2.1+i*1.4,3.4,ez-2.76,false,false));
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('ideas'),hx(acc)),transparent:true,toneMapped:false}),-1.6,3.9,ez-3.6,0,0),'ideas',hx(acc));
    anims.push(t=>{ const st=Math.floor(t*0.5)%5; ms.forEach((m,i)=> m.material.color.setHex(i<st?acc:0xD3DBE2)); });
  },
  nancy(g,acc,ez){
    writingDesk(g,acc,-4.2,ez+1.9);
    readingNook(g,acc,4.4,ez+2.6); shelf(g,acc,-7.2,ez-1.0,Math.PI/2);
    const nd=[];
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2;
      nd.push(B(g,.55,.55,.55,new THREE.MeshLambertMaterial({color:0xD3DBE2}),4.8+Math.cos(a)*2.0,2.8+Math.sin(a)*1.7,ez-2.6,false,true)); }
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('byz'),hx(acc)),transparent:true,toneMapped:false}),-1.2,3.7,ez-3.6,0,0),'byz',hx(acc));
    anims.push(t=>{ const bad=Math.floor(t*1.2)%7; nd.forEach((n,i)=> n.material.color.setHex(i===bad?0xC8402F:acc)); });
  },
  sriram(g,acc,ez){
    labBench(g,acc,-4.2,ez+1.9);
    anechoic(g,acc,-3.3,6.5,ez-4.45); plant(g,7.6,ez+4.4);
    Cyl(g,.14,.3,5.0,8,M.metal,5.2,2.5,ez-2.6,false);
    const rg=[];
    for(let i=0;i<4;i++){
      const r=new THREE.Mesh(new THREE.TorusGeometry(0.85,0.055,6,24),new THREE.MeshBasicMaterial({color:acc,transparent:true}));
      r.position.set(5.2,5.0,ez-2.6); r.rotation.x=Math.PI/2; g.add(r); rg.push(r);
    }
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('sig'),hx(acc)),transparent:true,toneMapped:false}),-1.2,3.7,ez-3.6,0,0),'sig',hx(acc));
    anims.push(t=>{ rg.forEach((r,i)=>{ const p=((t*0.5+i/4)%1), s=0.4+p*3.2;
      r.scale.set(s,s,1); r.material.opacity=1-p; }); });
  }
};

function portraitFrame(g,acc,id,ez){
  const ph=PHOTO[id]; if(!ph) return;
  const z=ez-4.55;
  B(g,3.05,3.95,0.26,M.dark,-6.8,4.2,z,false,true);
  B(g,3.25,0.16,0.3,new THREE.MeshLambertMaterial({color:acc}),-6.8,2.15,z,false,false);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(2.72,3.62),
    new THREE.MeshBasicMaterial({map:photoTex(ph.p)}));
  m.position.set(-6.8,4.2,z+0.15); g.add(m);
  Cyl(g,.08,.08,0.8,8,M.dark,-6.8,6.6,z+0.8,false);
  B(g,0.44,0.14,0.44,new THREE.MeshLambertMaterial({color:0xFFF3E2}),-6.8,6.2,z+0.8,false,false);
}

const STAND={ muriel:{yaw:0,route:ez=>[[-1.7,ez-2.6,0.5],[-6.2,ez-2.6,0.5],[-6.2,ez+0.9,0],[-6.2,1.5,0],[-0.4,1.5,0]]} };
