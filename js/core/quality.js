/* ------------------------------ QUALITY ------------------------------ */
const edgeList=[];
let quality=3, fpsT=0, fpsN=0;
let shadowTick=0; const shadowAt={x:1e9,z:1e9};
function dropQuality(){
  if(quality===3){
    // first step is cheap: drop the per pixel detail, keep shadows and materials
    quality=2;
    scene.environment=null;
    for(const k in M){ const m=M[k];
      if(m && m.normalMap){ m.normalMap=null; m.needsUpdate=true; } }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  } else if(quality===2){
    quality=1;
    renderer.shadowMap.enabled=false;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
    scene.traverse(o=>{ if(o.isMesh){ o.castShadow=false; if(o.material) o.material.needsUpdate=true; } });
  } else if(quality===1){
    quality=0;
    for(let i=0;i<edgeList.length;i++) edgeList[i].visible=false;
  }
}
