/* ------------------------------ BUILDING ------------------------------ */
function makeBuilding(cfg){
  const {x,z,yaw,w,d,h,accent,data,zone,style,room,person,mine} = cfg;
  const accRefs=[];
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=yaw; scene.add(g);
  const t=0.6, DW=4.4, DH=4.4;

  // ground shadow + plinth
  const ap=0.9;
  B(g,w+1.8,0.34,ap*2,M.walk,0,0.17,d/2+ap,false,true);
  B(g,w+1.8,0.34,ap*2,M.walk,0,0.17,-(d/2+ap),false,true);
  B(g,ap*2,0.34,d,M.walk,w/2+ap,0.17,0,false,true);
  B(g,ap*2,0.34,d,M.walk,-(w/2+ap),0.17,0,false,true);
  const accM=new THREE.MeshLambertMaterial({color:accent});
  accRefs.push({material:accM});
  B(g,w+2.0,0.1,0.42,accM,0,0.38,(d+1.8)/2,false,false);
  B(g,w+2.0,0.1,0.42,accM,0,0.38,-(d+1.8)/2,false,false);
  B(g,0.42,0.1,d+1.8,accM,(w+1.8)/2,0.38,0,false,false);
  B(g,0.42,0.1,d+1.8,accM,-(w+1.8)/2,0.38,0,false,false);

  // floor, ceiling, roof
  B(g,w,0.12,d,M.floorIn,0,0.0,0,false,false);
  B(g,w,0.35,d,M.ceil,0,h-0.18,0,false,false);
  B(g,w+1.6,0.8,d+1.6,new THREE.MeshLambertMaterial({color:0xBAC4CE}),0,h+0.4,0,false,true);
  B(g,w+1.75,0.14,d+1.75,new THREE.MeshLambertMaterial({color:accent}),0,h+0.86,0,false,false);
  /* a slab of snow that overhangs the cap slightly, so it reads as settled
     rather than painted on */
  if(SEASON==='winter') B(g,w+1.9,0.22,d+1.9,SNOW_MAT,0,h+1.02,0,false,false);

  // walls, door on +z
  const seg=(w-DW)/2;
  B(g,seg,h,t,M.wall,-(DW/2+seg/2),h/2,d/2-t/2,true,true);
  B(g,seg,h,t,M.wall, (DW/2+seg/2),h/2,d/2-t/2,true,true);
  B(g,DW,h-DH,t,M.wall,0,DH+(h-DH)/2,d/2-t/2,false,true);
  B(g,w,h,t,M.wall,0,h/2,-(d/2-t/2),true,true);
  B(g,t,h,d,M.wall,-(w/2-t/2),h/2,0,true,true);
  B(g,t,h,d,M.wall, (w/2-t/2),h/2,0,true,true);

  /* Window slots on the side walls. By day they are painted in the house
     accent, as before. After dark roughly half of them are lit from inside
     and the rest stay out, decided per window so no two buildings read the
     same, and the accent tinting is skipped because a lit window is not the
     colour of the owner's role. */
  /* the sills are collected and merged into one mesh per building below */
  const sillG=[], sillM=[];
  for(let i=0;i<3;i++){
    for(const side of [-1,1]){
      let m;
      if(DARK){
        const q=winRnd();
        m = q<0.40 ? WIN_LIT : (q<0.56 ? WIN_WARM : WIN_OUT);
      } else m = WIN_DAY;
      const mesh=B(g,0.14,1.6,3.2,m,side*(w/2+0.02),3.2,-4.5+i*4.5,false,false);
      if(DARK && mesh) litWindows.push(mesh);
      sillG.push(new THREE.BoxGeometry(0.36,0.11,3.5));
      sillM.push(new THREE.Matrix4().makeTranslation(side*(w/2+0.12),3.2-0.86,-4.5+i*4.5));
      /* The ground patch, only under the middle window of a side and only
         when that one is lit. One per side rather than one per window: at
         three each these are additive quads, and thirty buildings would put
         a hundred of them in the frame for no visible gain. */
      if(DARK && i===1 && quality>=2 && (m===WIN_LIT||m===WIN_WARM)){
        const sp=new THREE.Mesh(new THREE.PlaneGeometry(6.4,7.6), spillMat());
        sp.rotation.x=-Math.PI/2;
        sp.position.set(side*(w/2+2.6), 0.045, -4.5+i*4.5);
        g.add(sp);
      }
    }
  }
  { const s=new THREE.Mesh(mergeGeos(sillG,sillM),SILL_MAT); s.castShadow=true; s.receiveShadow=true; g.add(s); }
  B(g,DW+0.9,0.4,1.0,new THREE.MeshLambertMaterial({color:accent}),0,DH+0.25,d/2+0.15,false,true);

  // mounted signboard
  const bw=Math.min(w-3.0,7.2), bh=bw/4;
  const sgz=d/2+1.0;
  B(g,bw+0.5,bh+0.5,0.4,M.dark,0,DH+2.4,sgz,false,true);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(bw,bh),new THREE.MeshBasicMaterial({map:signTexture(data.name,data.sub,hx(accent)),toneMapped:false}));
  face.position.set(0,DH+2.4,sgz+0.21); g.add(face);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(bw,bh),new THREE.MeshBasicMaterial({map:face.material.map}));
  back.position.set(0,DH+2.4,sgz-0.21); back.rotation.y=Math.PI; g.add(back);
  B(g,0.18,0.18,1.0,M.metal,-bw*0.34,DH+2.4,d/2+0.5,false,false);
  B(g,0.18,0.18,1.0,M.metal, bw*0.34,DH+2.4,d/2+0.5,false,false);

  (STYLE[style]||STYLE.cube)(g,w,d,h,accent);

  // interior: runner, plaque (left of the entrance), rope, exhibit
  const pz=d/2-3.8, ropeZ=d/2-7.6, ez=-d/2+5.6;
  B(g,3.4,0.06,d-2.6,new THREE.MeshLambertMaterial({color:accent}),0,0.09,0.4,false,false);

  const wx=-w/2+0.8, wz=(pz+ropeZ)/2;
  const panel=B(g,0.3,3.4,5.6,M.trim,wx,2.5,wz,false,true);
  B(g,0.34,0.16,5.8,new THREE.MeshLambertMaterial({color:accent}),wx+0.02,4.4,wz,false,false);
  const pf=new THREE.Mesh(new THREE.PlaneGeometry(4.7,2.92),
    new THREE.MeshBasicMaterial({map:plaqueTexture(mine?roleLabel(profile.role):(data.guest?roleLabel(data.guest.role):(data.res?(data.res.role==='mod'?'MOD':'Mumbassador'):zn(zone))),data.name,(data.stand||(data.guest?[((data.guest.bio||'').trim()||tr('believer')),(data.guest.x?'@'+data.guest.x:'')]:data.res?[tr(data.res.role==='mod'?'resMod':'resMum').slice(0,58),'@'+(data.res.x||'').split('/').filter(Boolean).pop()]:C_(data.id).stand)),hx(accent)),transparent:true,toneMapped:false}));
  pf.position.set(wx+0.17,2.5,wz); pf.rotation.y=Math.PI/2; g.add(pf);
  plaques.push({m:pf,zone:zone,data:data,acc:accent});
  mapItems.push({x:x,z:z,w:(Math.abs(Math.cos(yaw))>0.5?w:d),d:(Math.abs(Math.cos(yaw))>0.5?d:w),c:hx(accent)});

  const rx=w/2-1.5;
  [-rx,-rx/3,rx/3,rx].forEach(sx=>{
    Cyl(g,.18,.18,1.1,10,M.dark,sx,0.62,ropeZ,false);
    Cyl(g,.24,.24,0.14,10,new THREE.MeshLambertMaterial({color:accent}),sx,1.2,ropeZ,false);
    Cyl(g,.34,.34,0.1,12,M.dark,sx,0.12,ropeZ,false);
  });
  for(let i=0;i<3;i++){
    const a=[-rx,-rx/3,rx/3][i], b=[-rx/3,rx/3,rx][i], L=b-a;
    const r1=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,L*0.52,8),M.rope);
    r1.position.set(a+L*0.26,1.02,ropeZ); r1.rotation.z=Math.PI/2-0.15; g.add(r1);
    const r2=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,L*0.52,8),M.rope);
    r2.position.set(b-L*0.26,1.02,ropeZ); r2.rotation.z=Math.PI/2+0.15; g.add(r2);
  }
  colliders.push(worldAABB(g,w-1.2,0.7,0,ropeZ));

  if(mine){
    /* the same building everyone else gets. Only the references are kept,
       so editing your card repaints the sign without a reload. */
    data.wx=x; data.wz=z; data.wyaw=yaw;
    (EXHIBIT[data.key]||EXHIBIT.showcase)(g,accent,ez,data);
    houseRefs={sign:face,sign2:back,plaque:pf,plate:null,art:null,accents:accRefs,spot:null};
  }
  else if(room){ ROOM[room](g,accent,ez); portraitFrame(g,accent,room,ez); }
  else { data.wx=x; data.wz=z; data.wyaw=yaw; (EXHIBIT[data.key]||EXHIBIT.showcase)(g,accent,ez,data); }

  if(person){
    const st=STAND[room];
    if(st) makePerson(g,{look:person.look,route:st.route(ez),stand:1,baseYaw:st.yaw,speed:1.0});
    else makePerson(g,{look:person.look,a:[-5.8,ez+4.8],b:[5.4,ez+4.4],speed:1.15});
  }

  const sp=worldAABB(g,1,1,0,(pz+ropeZ)/2);
  const spot={x:sp.x,z:sp.z,r:7.2,data:data,zone:zone,accent:accent};
  spots.push(spot);
  if(mine && houseRefs) houseRefs.spot=spot;
  const rm=worldAABB(g,w,d,0,0);
  const rmRec={x1:rm.x1,x2:rm.x2,z1:rm.z1,z2:rm.z2,lx:rm.x,lz:rm.z,ly:h*0.72};
  rooms.push(rmRec);
  if(data && data.id==='muriel') MURIEL_ROOM=rmRec;
  return g;
}
