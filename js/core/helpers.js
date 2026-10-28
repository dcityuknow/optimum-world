/* ------------------------------ HELPERS ------------------------------ */
function worldAABB(group, w, d, lx, lz){
  const yaw=group.rotation.y, c=Math.cos(yaw), s=Math.sin(yaw);
  const wx=group.position.x + lx*c + lz*s;
  const wz=group.position.z - lx*s + lz*c;
  const ww=Math.abs(w*c)+Math.abs(d*s), wd=Math.abs(w*s)+Math.abs(d*c);
  return {x1:wx-ww/2,x2:wx+ww/2,z1:wz-wd/2,z2:wz+wd/2,x:wx,z:wz};
}
function outline(parent, mesh){
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), M.edge);
  e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale);
  parent.add(e); edgeList.push(e);
}
function B(group,w,h,d,mat,lx,ly,lz,solid,edge){
  const geo=new THREE.BoxGeometry(w,h,d);
  const us=mat&&mat.userData&&mat.userData.uvScale;
  if(us) uvScaleBox(geo,w,h,d,us);
  const m=new THREE.Mesh(geo,mat);
  m.position.set(lx,ly,lz); group.add(m);
  if(solid) colliders.push(worldAABB(group,w,d,lx,lz));
  if(edge) outline(group,m);
  return m;
}
function Cyl(group,rt,rb,h,seg,mat,lx,ly,lz,solid){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);
  m.position.set(lx,ly,lz); group.add(m);
  if(solid) colliders.push(worldAABB(group,rb*2,rb*2,lx,lz));
  return m;
}
function Plane(group,w,h,mat,lx,ly,lz,rx,ry){
  const geo=new THREE.PlaneGeometry(w,h);
  const us=mat&&mat.userData&&mat.userData.uvScale;
  if(us) uvScalePlane(geo,w,h,us);
  const m=new THREE.Mesh(geo,mat);
  m.position.set(lx,ly,lz); if(rx) m.rotation.x=rx; if(ry) m.rotation.y=ry;
  group.add(m); return m;
}

/* Seeded RNG so the scenery is identical on every load */
function seedRnd(a){
  return function(){
    a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
