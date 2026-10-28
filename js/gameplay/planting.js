/* ------------------------------ PLANTING ------------------------------
   Everything here is instanced. Hundreds of plants cost about six draw calls
   in total, which matters because the frame budget is already tight on phones. */
function plantWorld(){
  const leaf=SEASONS[SEASON].leaf;
  const M_bark  = SM({color:0x7A6A58, roughness:0.95});
  /* a canopy sits between y=3 and y=9, a bush and a tuft are centred near
     zero, so each gets its own hinge height and its own amount of give */
  const M_leaf  = windify(SM({color:leaf, roughness:0.92}), 0.030, 2.6);
  const M_bush  = windify(SM({color:leaf, roughness:0.94}), 0.038, -0.9);
  const M_tuft  = windify(SM({color:SEASONS[SEASON].grass, roughness:0.98}), 0.075, 0.0);
  const M_pot   = SM({color:0xC2CDD8, roughness:0.82, metalness:0.06});

  // one tree canopy = three brand blobs merged, so it reads organic not lumpy
  // a tree has to read against 10 unit buildings, so the canopy tops out near 9
  const cg=[], cm=[];
  [[0,5.9,0,3.15,2.05],[-1.75,4.85,1.05,2.35,1.55],[1.6,5.1,-0.95,2.15,1.45]]
    .forEach((p,i)=>{
      cg.push(blobGeometry(2200+i*53,10,12));
      cm.push(new THREE.Matrix4().compose(
        new THREE.Vector3(p[0],p[1],p[2]),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0,i*1.3,0)),
        new THREE.Vector3(p[3],p[4],p[3])));
    });
  const canopyG=mergeGeos(cg,cm);
  const trunkG=new THREE.CylinderGeometry(0.28,0.5,5.2,8);
  trunkG.translate(0,2.6,0);
  const bushG=blobGeometry(3301,10,11);
  const tuftG=mergeGeos(
    [new THREE.ConeGeometry(0.10,0.66,4),new THREE.ConeGeometry(0.09,0.52,4),new THREE.ConeGeometry(0.08,0.44,4)],
    [new THREE.Matrix4().makeTranslation(0,0.33,0),
     new THREE.Matrix4().compose(new THREE.Vector3(0.16,0.26,0.07),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,0.3)),new THREE.Vector3(1,1,1)),
     new THREE.Matrix4().compose(new THREE.Vector3(-0.14,0.22,-0.1),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-0.34)),new THREE.Vector3(1,1,1))]);
  const potG=mergeGeos(
    [new THREE.BoxGeometry(1.5,0.9,1.5),new THREE.BoxGeometry(1.66,0.14,1.66)],
    [new THREE.Matrix4().makeTranslation(0,0.45,0),new THREE.Matrix4().makeTranslation(0,0.94,0)]);

  const trees=[], bushes=[], tufts=[], pots=[];
  const rnd=seedRnd(90210);
  const push=(arr,x,y,z,sx,sy,sz,ry)=>arr.push({x:x,y:y,z:z,sx:sx,sy:sy,sz:sz,ry:ry});

  // street trees on the verge, offset from the lamp rhythm so they interleave
  const line=(ax,from,to,step,offs)=>{
    for(let d=from; d<=to; d+=step){
      offs.forEach(o=>{
        const x = ax==='z' ? o : d, z = ax==='z' ? d : o;
        if(!spotFree(x,z,2.2)) return;
        const sc=0.9+rnd()*0.5;
        push(trees,x,0,z,sc,sc*(0.9+rnd()*0.35),sc,rnd()*6.283);
        if(rnd()<0.55) push(bushes,x+(rnd()-.5)*4.6,0,z+(rnd()-.5)*4.6,
          0.85+rnd()*0.5,0.8+rnd()*0.5,0.85+rnd()*0.5,rnd()*6.283);
      });
    }
  };
  line('z',-40,-116,24,[-16.5,16.5]);   // city street
  line('x',-40,-224,24,[-16.5,16.5]);   // team street
  /* The community verge is not a plain line any more. A tree opposite a
     house is a tree in front of its nick, so each side is planted only on
     the gaps between its own plots — which is exactly where the other
     side's houses stand. The row reads as an avenue, every board stays
     legible from the road. */
  const cTo=Math.max(224,CEND-14);
  [[16.5,true],[-16.5,false]].forEach(side=>{
    rowGaps(side[1], ROW.x0-4, cTo).forEach(x=>{
      const z=side[0], sc=0.9+rnd()*0.5;
      push(trees,x,0,z,sc,sc*(0.9+rnd()*0.35),sc,rnd()*6.283);
      dressTree(x,z,sc,rnd);
      if(rnd()<0.5) push(bushes,x+(rnd()-.5)*3.4,0,z+(rnd()-.5)*2.2,
        0.85+rnd()*0.45,0.8+rnd()*0.45,0.85+rnd()*0.45,rnd()*6.283);
    });
  });

  // planters flanking the plaza approaches
  [[-33,-33],[33,-33],[-33,33],[33,33],[-38,0],[38,0],[0,-38],[0,38]].forEach(p=>{
    push(pots,p[0],0,p[1],1,1,1,0);
    push(bushes,p[0],0.9,p[1],0.6,0.62,0.6,rnd()*6.283);
  });

  // scattered woodland out in the field
  const FIELD=Math.max(250, XMAX-40);
  for(let i=0;i<220;i++){
    const a=rnd()*6.283, r=46+rnd()*FIELD;
    const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!spotFree(x,z,2.4)) continue;
    const sc=0.8+rnd()*0.9;
    if(rnd()<0.62) push(trees,x,0,z,sc,sc*(0.85+rnd()*0.5),sc,rnd()*6.283);
    else push(bushes,x,0,z,1.0+rnd()*1.1,0.9+rnd()*1.0,1.0+rnd()*1.1,rnd()*6.283);
  }
  // grass tufts hugging the verges and the open ground
  for(let i=0;i<520;i++){
    const a=rnd()*6.283, r=42+rnd()*(FIELD-35);
    const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!spotFree(x,z,0.6)) continue;
    const sc=0.7+rnd()*0.9;
    push(tufts,x,0,z,sc,sc*(0.7+rnd()*0.8),sc,rnd()*6.283);
  }

  const dummy=new THREE.Object3D();
  const bake=(geo,mat,list,fixY)=>{
    if(!list.length) return null;
    const im=new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach((t,i)=>{
      dummy.position.set(t.x, t.y + (fixY? t.sy : 0), t.z);
      dummy.rotation.set(0,t.ry,0);
      dummy.scale.set(t.sx,t.sy,t.sz);
      dummy.updateMatrix();
      im.setMatrixAt(i,dummy.matrix);
    });
    im.instanceMatrix.needsUpdate=true;
    im.castShadow=true; im.receiveShadow=true;
    im.frustumCulled=false;
    scene.add(im);
    return im;
  };
  bake(trunkG, M_bark, trees, false);
  bake(canopyG,M_leaf, trees, false);
  bake(bushG,  M_bush, bushes, true);   // lathe is centred, lift by its half height
  bake(tuftG,  M_tuft, tufts, false);
  bake(potG,   M_pot,  pots,  false);

  // trees are solid enough to walk into
  trees.forEach(t=>colliders.push({x1:t.x-0.8,x2:t.x+0.8,z1:t.z-0.8,z2:t.z+0.8}));
  pots.forEach(t=>colliders.push({x1:t.x-0.85,x2:t.x+0.85,z1:t.z-0.85,z2:t.z+0.85}));
}
