/* ------------------------------ EXHIBITS ------------------------------ */
const EXHIBIT = {
  rlnc(g,acc,ez){
    B(g,3.4,1.0,3.4,M.trim,-5.2,0.5,ez,false,true);
    B(g,3.4,1.0,3.4,M.trim, 5.2,0.5,ez,false,true);
    const cols=[C.azure,C.mint,C.peach,C.lavender], src=[], dst=[];
    for(let i=0;i<4;i++){
      src.push(B(g,.8,.8,.8,new THREE.MeshLambertMaterial({color:cols[i]}),-5.2+(i%2)*1.2-0.6,1.6+Math.floor(i/2)*1.2,ez,false,true));
      dst.push(B(g,.8,.8,.8,new THREE.MeshLambertMaterial({color:0xE6EBF1,emissive:0x000000}), 5.2+(i%2)*1.2-0.6,1.6+Math.floor(i/2)*1.2,ez,false,true));
    }
    regBoard(Plane(g,2.8,0.7,new THREE.MeshBasicMaterial({map:tagTexture(bt('orig')[0],hx(acc)),transparent:true,toneMapped:false}),-5.2,0.22,ez+2.0,-Math.PI/2.3,0),'orig',hx(acc),'tag');
    regBoard(Plane(g,2.8,0.7,new THREE.MeshBasicMaterial({map:tagTexture(bt('reb')[0],hx(acc)),transparent:true,toneMapped:false}),5.2,0.22,ez+2.0,-Math.PI/2.3,0),'reb',hx(acc),'tag');
    const coded=[];
    for(let i=0;i<7;i++) coded.push(B(g,.66,.66,.66,new THREE.MeshLambertMaterial({color:acc}),0,2.2,ez,false,true));
    regBoard(Plane(g,5.8,3.6,new THREE.MeshBasicMaterial({map:boardTexture(bt('rlnc'),hx(acc)),transparent:true,toneMapped:false}),0,4.9,ez-1.6,0,0),'rlnc',hx(acc));
    anims.push(t=>{
      coded.forEach((c,i)=>{
        const p=((t*0.3+i/7)%1);
        c.position.x=-5.2+p*10.4; c.position.y=2.4+Math.sin(p*Math.PI)*1.6;
        c.rotation.y=t*1.5+i; c.rotation.x=t*1.0;
      });
      const step=Math.floor((t*1.2)%5);
      dst.forEach((c,i)=> c.material.color.setHex(i<step?cols[i]:0xE6EBF1));
      src.forEach((c,i)=> c.position.y=1.6+Math.floor(i/2)*1.2+Math.sin(t*2+i)*0.07);
    });
  },
  mump2p(g,acc,ez){
    const accM=new THREE.MeshLambertMaterial({color:acc});
    // the client and the sidecar bolted to it
    B(g,2.3,4.2,2.3,M.dark,-6.0,2.1,ez,false,true);
    regBoard(Plane(g,1.9,1.19,new THREE.MeshBasicMaterial({map:screenTexture(bt('client')[0],bt('client').slice(1),hx(acc)),transparent:true,toneMapped:false}),-6.0,3.0,ez+1.18,0,0),'client',hx(acc),'screen');
    B(g,1.7,2.9,1.7,accM,-3.9,1.45,ez,false,true);
    regBoard(Plane(g,1.4,0.88,new THREE.MeshBasicMaterial({map:screenTexture(bt('sidecar')[0],bt('sidecar').slice(1),'#282C34'),transparent:true,toneMapped:false}),-3.9,2.1,ez+0.88,0,0),'sidecar','#282C34','screen');
    // the peers that receive
    const peers=[];
    for(let i=0;i<6;i++){
      const px=3.2+(i%3)*2.4, pz=ez-2.4+Math.floor(i/3)*4.6;
      const m=B(g,1.1,2.4,1.1,new THREE.MeshLambertMaterial({color:0xD3DBE2}),px,1.2,pz,false,true);
      regBoard(Plane(g,0.85,0.53,new THREE.MeshBasicMaterial({map:screenTexture(bt('peer')[0],[],hx(acc)),transparent:true,toneMapped:false}),px,1.9,pz+0.57,0,0),'peer',hx(acc),'screen');
      peers.push({m:m,x:px,z:pz,lit:0});
    }
    regBoard(Plane(g,5.4,3.4,new THREE.MeshBasicMaterial({map:boardTexture(bt('mump'),hx(acc)),transparent:true,toneMapped:false}),-0.6,6.4,ez-3.4,0,0),'mump',hx(acc));
    const flow=[];
    for(let i=0;i<12;i++) flow.push({m:B(g,.42,.42,.42,accM,0,2,ez,false,false), p:i%6, off:i/12});
    anims.push(t=>{
      peers.forEach(pe=> pe.lit=Math.max(0,pe.lit-0.03));
      flow.forEach(f=>{
        const k=((t*0.42+f.off)%1), pe=peers[f.p];
        f.m.position.x=-3.9+(pe.x+3.9)*k;
        f.m.position.z=ez+(pe.z-ez)*k;
        f.m.position.y=2.2+Math.sin(k*Math.PI)*1.5;
        f.m.rotation.y=t*2+f.off*6;
        if(k>0.95) pe.lit=1;
      });
      peers.forEach(pe=> pe.m.material.color.setHex(pe.lit>0.35?acc:0xD3DBE2));
    });
  },
  speed(g,acc,ez){
    const lz=[ez-1.9,ez+1.9];
    [0,1].forEach(k=>{
      B(g,12,0.3,1.7,M.trim,0,0.65,lz[k],false,true);
      B(g,0.35,1.8,2.0,M.dark,-6,1.6,lz[k],false,true);
      B(g,0.35,1.8,2.0,k?new THREE.MeshLambertMaterial({color:acc}):M.dark,6,1.6,lz[k],false,true);
    });
    regBoard(Plane(g,3.4,2.1,new THREE.MeshBasicMaterial({map:boardTexture(bt('gossip'),'#9DB0C2'),transparent:true,toneMapped:false}),0,5.4,ez-3.9,0,0),'gossip','#9DB0C2');
    regBoard(Plane(g,3.4,2.1,new THREE.MeshBasicMaterial({map:boardTexture(bt('fast'),hx(acc)),transparent:true,toneMapped:false}),0,3.0,ez-3.9,0,0),'fast',hx(acc));
    const slow=[],fast=[];
    for(let i=0;i<9;i++) slow.push(B(g,.55,.55,.55,new THREE.MeshLambertMaterial({color:0xA9B7C6}),0,1.2,lz[0],false,true));
    for(let i=0;i<3;i++) fast.push(B(g,.55,.55,.55,new THREE.MeshLambertMaterial({color:acc}),0,1.2,lz[1],false,true));
    anims.push(t=>{
      const cyc=(t*0.26)%1;
      slow.forEach((s,i)=>{ const p=Math.max(0,Math.min(1,cyc-i*0.03)); s.position.x=-6+p*12; s.position.z=lz[0]+((i%3)-1)*0.45; });
      fast.forEach((s,i)=>{ const p=Math.max(0,Math.min(1,cyc*4.5-i*0.05)); s.position.x=-6+p*12; });
    });
  },
  integration(g,acc,ez){
    const hs=[4.4,5.8,3.6], xs=[-4,0,4], cl=[0xAEBBC9,0x9DB0C2,0xD3DBE2];
    xs.forEach((x,i)=>{
      B(g,1.9,hs[i],1.9,new THREE.MeshLambertMaterial({color:cl[i]}),x,hs[i]/2,ez,false,true);
      Plane(g,1.6,1.0,new THREE.MeshBasicMaterial({map:screenTexture('CHAIN '+(i+1),bt('chain'),hx(acc)),transparent:true,toneMapped:false}),x,hs[i]-1.0,ez+0.98,0,0);
    });
    const ring=new THREE.Mesh(new THREE.TorusGeometry(5.4,0.16,8,54),new THREE.MeshLambertMaterial({color:acc}));
    ring.position.set(0,3.4,ez); ring.rotation.x=Math.PI/2; g.add(ring);
    const dots=[];
    for(let i=0;i<8;i++) dots.push(B(g,.45,.45,.45,new THREE.MeshLambertMaterial({color:acc}),0,3.4,ez,false,false));
    regBoard(Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(bt('perm'),hx(acc)),transparent:true,toneMapped:false}),0,7.8,ez-1.4,0,0),'perm',hx(acc));
    anims.push(t=>{
      ring.rotation.z=t*0.45;
      dots.forEach((dt,i)=>{ const a=t*0.45+i/8*Math.PI*2;
        dt.position.x=Math.cos(a)*5.4; dt.position.z=ez+Math.sin(a)*5.4; dt.position.y=3.4+Math.sin(t*2+i)*0.25; });
    });
  },
  validators(g,acc,ez){
    const pil=[];
    for(let r=0;r<5;r++) for(let c=0;c<8;c++){
      const m=B(g,.62,1.5,.62,new THREE.MeshLambertMaterial({color:0xD3DBE2}),-4.4+c*1.26,0.75,ez-1.8+r*0.95,false,false);
      pil.push({m:m,k:c+r*0.6});
    }
    regBoard(Plane(g,5.2,3.2,new THREE.MeshBasicMaterial({map:boardTexture(bt('partners'),hx(acc)),transparent:true,toneMapped:false}),0,5.2,ez-3.6,0,0),'partners',hx(acc));
    anims.push(t=>{
      pil.forEach(p=>{
        const k=(Math.sin(t*1.8-p.k*0.4)+1)/2;
        p.m.scale.y=0.7+k*1.5; p.m.position.y=0.75*p.m.scale.y;
        p.m.material.color.setHex(k>0.78?acc:0xD3DBE2);
      });
    });
  },
  timeline(g,acc,ez){
    const ids=['y2003','y2024','y2025','y2026'];
    const accM=new THREE.MeshLambertMaterial({color:acc});
    B(g,14.6,0.36,2.6,M.trim,0,0.18,ez,false,true);
    B(g,14.8,0.1,0.34,accM,0,0.4,ez+1.28,false,false);
    ids.forEach((id,i)=>{
      const x=-5.4+i*3.6;
      B(g,2.5,1.15,1.5,new THREE.MeshLambertMaterial({color:0xE8E2D6}),x,0.94,ez,false,true);
      B(g,2.66,0.1,1.66,accM,x,1.56,ez,false,false);
      const fr=new THREE.Mesh(new THREE.BoxGeometry(2.35,1.5,0.14),new THREE.MeshLambertMaterial({color:0x2B2F36}));
      fr.position.set(x,2.42,ez-0.18); fr.rotation.x=-0.22; g.add(fr); outline(g,fr);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(2.16,1.34),
        new THREE.MeshBasicMaterial({map:boardTexture(bt(id),hx(acc)),transparent:true,toneMapped:false}));
      face.position.set(0,0,0.08); fr.add(face);
      regBoard(face,id,hx(acc));
      Cyl(g,.05,.05,0.95,8,M.metal,x,2.05,ez-0.5,false);
    });
  },
  showcase(g,acc,ez,data){
    B(g,4.0,1.1,4.0,M.trim,0,0.55,ez,false,true);
    const card=Plane(g,4.4,2.7,new THREE.MeshBasicMaterial({map:boardTexture([data.name,data.sub],hx(acc)),transparent:true,side:THREE.DoubleSide,toneMapped:false}),0,3.3,ez,0,0);
    const orbs=[];
    for(let i=0;i<6;i++) orbs.push(B(g,.45,.45,.45,new THREE.MeshLambertMaterial({color:acc}),0,3,ez,false,false));
    anims.push(t=>{
      card.rotation.y=Math.sin(t*0.5)*0.42; card.position.y=3.3+Math.sin(t*1.2)*0.1;
      orbs.forEach((o,i)=>{ const a=t*0.8+i/6*Math.PI*2;
        o.position.x=Math.cos(a)*3.2; o.position.z=ez+Math.sin(a)*3.2; o.position.y=2.0+Math.sin(t*1.6+i)*0.5; });
    });
  },
  empty(g,acc,ez){
    B(g,4.4,0.6,4.4,M.trim,0,0.3,ez,false,true);
    const fr=new THREE.Mesh(new THREE.TorusGeometry(1.9,0.11,8,4),new THREE.MeshLambertMaterial({color:acc}));
    fr.position.set(0,2.8,ez); g.add(fr);
    Plane(g,3.8,2.3,new THREE.MeshBasicMaterial({map:boardTexture(['YOUR BUILD','goes right here'],hx(acc)),transparent:true,toneMapped:false}),0,5.4,ez-1.0,0,0);
    anims.push(t=>{ fr.rotation.z=Math.PI/4+t*0.4; fr.position.y=2.8+Math.sin(t*1.4)*0.18; });
  },
  resident(g,acc,ez,data){
    const r=(data&&data.res)||{};
    const live=(data&&data.live)||null;         // he signed in, so this is his house
    if(r.id==='katana' && data.wx!==undefined) katanaStand(g,acc,ez,data.wx,data.wz,data.wyaw);
    const hn=((live&&live.x)||r.x||'').split('/').filter(Boolean).pop();
    residentRoom(g,acc,ez,{
      img: (live&&live.photo)||PICS[r.id]||null,
      nick: r.nick||'',
      role: tr(r.role==='mod' ? 'roleMod' : 'roleMum'),
      handle: hn? '@'+hn : '',
      ref: data
    });
  },
  guest(g,acc,ez,data){
    const v=(data&&data.guest)||{};
    residentRoom(g,acc,ez,{
      img: v.photo||null,
      nick: v.nick||'',
      role: roleLabel(v.role),
      handle: v.x? '@'+v.x : '',
      ref: data
    });
  },
  hall(g,acc,ez){
    for(let i=0;i<5;i++){
      const a=-0.9+i*0.45;
      B(g,1.2,2.4+(i%2)*0.9,1.2,M.trim,Math.sin(a)*4.8,1.2+(i%2)*0.45,ez+Math.cos(a)*1.4-1.4,false,true);
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.4,0.13,8,44),new THREE.MeshLambertMaterial({color:acc}));
    ring.position.set(0,3.8,ez); ring.rotation.x=Math.PI/2.4; g.add(ring);
    Plane(g,4.8,3.0,new THREE.MeshBasicMaterial({map:boardTexture(['COMMUNITY','one house, one build'],hx(acc)),transparent:true,toneMapped:false}),0,6.0,ez-1.6,0,0);
    anims.push(t=>{ ring.rotation.z=t*0.35; });
  }
};
