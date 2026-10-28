/* ------------------------------ TEAM ROOMS ------------------------------ */
function desk(g,acc,x,z,screens){
  B(g,3.6,0.18,1.6,M.wood,x,1.05,z,false,true);
  B(g,0.18,1.0,1.4,M.metal,x-1.6,0.5,z,false,true);
  B(g,0.18,1.0,1.4,M.metal,x+1.6,0.5,z,false,true);
  B(g,0.95,0.14,0.95,M.dark,x,0.55,z+1.6,false,true);
  B(g,0.95,1.1,0.14,M.dark,x,1.15,z+2.05,false,true);
  Cyl(g,.1,.1,.55,8,M.metal,x,0.28,z+1.6,false);
  screens.forEach((s,i)=>{
    Cyl(g,.07,.07,.45,6,M.metal,x-1.0+i*2.0,1.35,z-0.35,false);
    B(g,1.62,1.06,0.08,M.dark,x-1.0+i*2.0,2.05,z-0.36,false,true);
    Plane(g,1.5,0.94,new THREE.MeshBasicMaterial({map:screenTexture(s[0],s.slice(1),hx(acc)),transparent:true,toneMapped:false}),x-1.0+i*2.0,2.05,z-0.31,0,0);
  });
}
