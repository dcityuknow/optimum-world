/* ------------------------------ THE SEA ------------------------------
   South of the crossroads the field used to run out into nothing. The water
   starts at z=235 and goes to the horizon: a displaced surface with a
   scrolling ripple normal for the sparkle, a sun road that follows whoever is
   looking at it, and a foam line that breathes against the sand.

   Fog is off on the water on purpose. The world's fog ends at 420 units and
   the sea is three times that deep, so fogging it would have swallowed the
   whole thing twenty metres past the beach; the horizon haze band below does
   that job instead, and only at the distance where it belongs. */
/* 200, not less: the dig site cairn stands at z=170 and a shoreline in
   front of it would have put the whole quest under water. */
/* shore is the visible waterline. under is how far the water carries on
   BEHIND it, hidden beneath the sand, so there is never an edge to catch. */
const SEA={shore:200, len:1200, wide:2400, y:0.0, under:34};
let seaMat=null, seaSh=null, seaGlit=null, seaFoam=null;

function rippleNormal(){
  const S=256, c=cvs(S,S), g=c.getContext('2d');
  const img=g.createImageData(S,S), d=img.data;
  for(let y=0;y<S;y++) for(let x=0;x<S;x++){
    const u=x/S*6.283, v=y/S*6.283;
    /* the height field, then its slope in each direction: four waves at
       different angles so the pattern never shows its tile */
    const hx=Math.cos(u*3)*0.5+Math.cos(u*7+v*2)*0.3+Math.cos(u*2-v*5)*0.2;
    const hz=Math.cos(v*4)*0.5+Math.cos(v*6+u*3)*0.3+Math.cos(v*2-u*4)*0.2;
    const i=(y*S+x)*4;
    d[i]  =128+hx*52;
    d[i+1]=128+hz*52;
    d[i+2]=235;
    d[i+3]=255;
  }
  g.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(46,26);
  return t;
}

function seaColors(){
  const k=SKIES[PHASE];
  /* deep is what you see looking out, shal is the shelf by the sand. Both
     are pushed hard: a washed out blue cannot survive being mixed with a
     near white sky reflection and still look like water. */
  if(PHASE==='golden') return {deep:0x0A3346, shal:0x1F7E92, glit:0xFFC178, gi:0.40};
  if(PHASE==='night') return {deep:0x040A14, shal:0x0C1C2E, glit:0xAFC6E8, gi:0.16};
  if(PHASE==='dusk')  return {deep:0x0C1730, shal:0x3B2C55, glit:0xFF9E58, gi:0.42};
  if(PHASE==='dawn')  return {deep:0x101C36, shal:0x3F4468, glit:0xFFC48C, gi:0.36};
  return {deep:0x073A5C, shal:0x108FA8, glit:0xFFEFC4, gi:0.26};
}

function makeSea(){
  const C=seaColors();
  /* 200 by 110 segments over 2400 by 1200 units. The swells are analytic in
     the shader so the lighting would be smooth at any density, but the mesh
     still has to be fine enough that the silhouette of a wave against the sky
     is a curve rather than a staircase. */
  const geo=new THREE.PlaneGeometry(SEA.wide, SEA.len, 200, 110);

  /* Depth colour, baked per vertex on the CPU because it never changes: the
     water is a pale green over the shelf by the beach and goes to near black
     offshore. This alone does most of the work of making it look like it has
     a bottom. */
  {
    const p=geo.attributes.position, n=p.count;
    const col=new Float32Array(n*3);
    const shal=new THREE.Color(C.shal), deep=new THREE.Color(C.deep), tmp=new THREE.Color();
    for(let i=0;i<n;i++){
      /* local y runs from -len/2 at the shore edge to +len/2 out to sea */
      const along=(p.getY(i)+SEA.len/2)/SEA.len;
      /* the shelf is the first 60 units, then it drops away: spreading the
         ramp over the whole 1200 made the entire sea one flat tone */
      const k=Math.min(1, Math.pow(along*16.0, 0.62));
      tmp.copy(shal).lerp(deep, k);
      col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  }

  /* The sky, as six faces, used as an environment map. This is the single
     biggest reason water stops looking like painted lino: a reflective
     surface lit only by a lamp is flat, one that reflects a sky has a
     Fresnel edge, bright where you see it at a glance and dark where you
     look straight down into it. */
  const skyCube=(()=>{
    const K=SKIES[PHASE];
    const face=(top,bot)=>{
      const c=cvs(64,64), g=c.getContext('2d');
      const lg=g.createLinearGradient(0,0,0,64);
      lg.addColorStop(0,top); lg.addColorStop(1,bot);
      g.fillStyle=lg; g.fillRect(0,0,64,64);
      return c;
    };
    const hx=(v)=>'#'+('000000'+(v>>>0).toString(16)).slice(-6);
    /* top and mid in SKIES are already CSS strings while fog is a number:
       running the strings through a hex formatter turned the sky black */
    const up=K.top||'#3F91E4', mid=K.mid||'#A9CDEC', lo=hx(K.fog);
    const side=face(mid,lo), floor=hx(C.deep);
    const t=new THREE.CubeTexture([
      side, side,                     // +x, -x
      face(up,mid), face(floor,floor),// +y the sky, -y the water's own body
      side, side                      // +z, -z
    ]);
    t.needsUpdate=true;
    return t;
  })();

  /* Water is a dielectric, not a metal. At metalness 0.86 the body colour
     is suppressed and it turns into a mirror; near zero it keeps the depth
     gradient and still throws a hard reflection at a glancing angle, which
     is what water actually does. */
  seaMat = PBR
    ? SM({color:0xFFFFFF, roughness:0.18, metalness:0.06,
          normalMap:rippleNormal(), normalScale:1.4})
    : new THREE.MeshPhongMaterial({color:0xFFFFFF, shininess:90,
          specular:0x6E90AE, normalMap:rippleNormal(), reflectivity:0.3});
  seaMat.envMap=skyCube;
  seaMat.vertexColors=true;
  /* Rougher and far less reflective than the physically pretty version.
     A real sea IS a mirror at a glancing angle, and that is precisely why
     the last one read as a white sheet from the shore. */
  if(seaMat.envMapIntensity!==undefined) seaMat.envMapIntensity=0.34;
  /* Two crossing swells and two shorter chops, each with its own direction.
     The important part is the second half: the surface normal is worked out
     from the SLOPE of that sum rather than left as flat-up, which is what
     makes a wave catch the sun on one face and sit dark on the other. Without
     it the water is a flat sheet that happens to wobble. */
  seaMat.onBeforeCompile=(sh)=>{
    try{
      sh.uniforms.uT={value:0};
      sh.vertexShader='uniform float uT;\nvarying float vCrest;\nvarying float vShore;\n'+sh.vertexShader;
      sh.vertexShader=sh.vertexShader.replace('#include <beginnormal_vertex>',
        '  float A1=0.62, A2=0.42, A3=0.22, A4=0.10;\n'+
        '  float p1=(position.x*0.62+position.y*0.78)*0.016 + uT*0.52;\n'+
        '  float p2=(position.x*-0.34+position.y*0.94)*0.034 - uT*0.88;\n'+
        '  float p3=(position.x*0.92+position.y*0.39)*0.071 + uT*1.35;\n'+
        '  float p4=(position.x*0.44-position.y*0.90)*0.132 + uT*2.10;\n'+
  /* distance out from the hidden near edge, in world units */
        '  float sd = position.y + '+(SEA.len*0.5).toFixed(1)+';\n'+
  /* A swell cannot be three metres tall where the water is ankle deep. The
     amplitude ramps in over the first eighty units, which is also what
     keeps the waterline pinned flat under the sand instead of flapping. */
        '  float shoreK = smoothstep(0.0, 170.0, sd);\n'+
        '  shoreK *= smoothstep(30.0, 90.0, '+(SEA.len*0.5).toFixed(1)+' - position.y);\n'+
      /* sheltered water in the lee of the pier: the swell dies away within
         thirty units of it, so the piles stand in calm water */
      '  shoreK *= mix(0.18, 1.0, smoothstep(9.0, 34.0, abs(position.x - '+PIER.x.toFixed(1)+')));\n'+
        '  float wH = (A1*sin(p1)+A2*sin(p2)+A3*sin(p3)+A4*sin(p4)) * shoreK;\n'+
        '  float dX = (A1*0.62*0.016*cos(p1) + A2*-0.34*0.034*cos(p2)\n'+
        '           + A3*0.92*0.071*cos(p3) + A4*0.44*0.132*cos(p4)) * shoreK;\n'+
        '  float dY = (A1*0.78*0.016*cos(p1) + A2*0.94*0.034*cos(p2)\n'+
        '           + A3*0.39*0.071*cos(p3) + A4*-0.90*0.132*cos(p4)) * shoreK;\n'+
        '  vec3 objectNormal = normalize(vec3(-dX, -dY, 1.0));\n');
      sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n'+
        '  transformed.z += wH;\n'+
        // the steepness of the face, not its height: that is where foam forms
        '  vCrest = clamp((wH*0.30 + length(vec2(dX,dY))*7.0), 0.0, 1.5);\n'+
        '  vShore = sd;\n');
      sh.fragmentShader='varying float vCrest;\nvarying float vShore;\nuniform float uT;\n'+sh.fragmentShader;
      sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
        '#include <opaque_fragment>\n'+
  /* whitecaps: the steep faces of the swell out in open water */
        '  gl_FragColor.rgb += vec3(0.88,0.94,1.00) * smoothstep(0.62,1.10,vCrest) * 0.85;\n'+
  /* And the thing that actually says SEA: ranks of white lines running in
     towards the beach, spaced about seventy units apart, thickening as they
     arrive and vanishing further out. Purely in the fragment shader, so
     they cost nothing and need no geometry. */
        '  float ln = sin(vShore*0.088 - uT*1.45);\n'+
        '  float brk = smoothstep(0.86, 1.0, ln) * exp(-max(vShore-30.0,0.0)*0.010);\n'+
        '  float ln2 = sin(vShore*0.052 - uT*0.95 + 2.1);\n'+
        '  brk += smoothstep(0.93, 1.0, ln2) * exp(-max(vShore-30.0,0.0)*0.006) * 0.7;\n'+
        '  gl_FragColor.rgb += vec3(0.92,0.96,1.00) * clamp(brk,0.0,1.0) * 0.9;\n');
      seaSh=sh;
    }catch(e){ console.warn('sea shader patch failed', e); }
  };
  seaMat.customProgramCacheKey=()=>'sea2';
  /* the water keeps its own fog off, because the world's ends at 420 and the
     sea is three times deeper; everything ON the water keeps fog ON */
  seaMat.fog=false;

  const sea=new THREE.Mesh(geo, seaMat);
  sea.rotation.x=-Math.PI/2;
  sea.position.set(0, SEA.y, SEA.shore - SEA.under + SEA.len/2);
  sea.receiveShadow=false; sea.castShadow=false;
  scene.add(sea);


  /* The sun road. It is additive and it tracks the viewer in x, because a
     glitter path always runs from the sun straight back to whoever is
     watching, and a fixed one gives the trick away the moment you walk. */
  {
    const c=cvs(64,256), g=c.getContext('2d');
    g.clearRect(0,0,64,256);
    for(let y=0;y<256;y++){
      /* wide and broken near the horizon, narrowing to a point at the shore */
      const k=y/256, wob=Math.sin(k*46)*0.22+Math.sin(k*17)*0.3;
      const wdt=(6+k*26)*(1+wob*0.35);
      const al=(0.85-k*0.72)*(0.55+0.45*Math.abs(Math.sin(k*30)));
      g.fillStyle='rgba(255,255,255,'+Math.max(0,al).toFixed(3)+')';
      g.fillRect(32-wdt/2, 255-y, wdt, 1);
    }
    const t=new THREE.CanvasTexture(c);
    t.wrapT=THREE.RepeatWrapping;
    seaGlit=new THREE.Mesh(new THREE.PlaneGeometry(110, SEA.len*0.7),
      new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false,
        blending:THREE.AdditiveBlending, fog:true, toneMapped:false,
        color:C.glit, opacity:C.gi}));
    seaGlit.rotation.x=-Math.PI/2;
    seaGlit.position.set(0, SEA.y+0.6, SEA.shore + SEA.len*0.48);
    scene.add(seaGlit);
  }

  /* sand, and the foam that runs along its edge */
  {
    /* sits ON TOP of the water's hidden near edge and hides it; the visible
       waterline is this strip's far edge and nothing else */
    /* wider and warmer. At 30 units of near white it was indistinguishable
       from the grass and the waterline looked like the world just ending. */
    const sand=new THREE.Mesh(new THREE.PlaneGeometry(SEA.wide, 52),
      SM({color:0xD9C49A, roughness:0.99}));
    sand.rotation.x=-Math.PI/2;
    sand.position.set(0, 0.07, SEA.shore-26);
    /* a darker damp band where the water has just been */
    const wet=new THREE.Mesh(new THREE.PlaneGeometry(SEA.wide, 11),
      SM({color:0xB3A480, roughness:0.72}));
    wet.rotation.x=-Math.PI/2;
    wet.position.set(0, 0.085, SEA.shore-4);
    scene.add(wet);
    sand.receiveShadow=true; scene.add(sand);

    const c=cvs(256,32), g=c.getContext('2d');
    g.clearRect(0,0,256,32);
    for(let i=0;i<70;i++){
      const x=Math.random()*256, w=8+Math.random()*30;
      const lg=g.createLinearGradient(0,32,0,0);
      lg.addColorStop(0,'rgba(255,255,255,0.9)');
      lg.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=lg;
      g.fillRect(x,32-(6+Math.random()*22),w,32);
    }
    const t=new THREE.CanvasTexture(c);
    t.wrapS=THREE.RepeatWrapping; t.repeat.set(30,1);
    /* 2400 units of unfogged white was the bar of light across the horizon */
    seaFoam=new THREE.Mesh(new THREE.PlaneGeometry(SEA.wide, 13),
      new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false,
        fog:true, toneMapped:false, opacity:0.45}));
    seaFoam.rotation.x=-Math.PI/2;
    seaFoam.position.set(0, SEA.y+0.12, SEA.shore+2);
    scene.add(seaFoam);
  }

  anims.push((t,dt)=>{
    if(seaSh) seaSh.uniforms.uT.value=t;
    if(seaMat.normalMap){
      seaMat.normalMap.offset.x = t*0.012;
      seaMat.normalMap.offset.y = t*0.020;
    }
    if(seaGlit && camera){
      /* follows you along the beach, and dims as you turn away from it */
      seaGlit.position.x += (camera.position.x - seaGlit.position.x)*Math.min(1,dt*1.6);
      seaGlit.material.map.offset.y = -t*0.03;
    }
    if(seaFoam){
      /* the tide, on a slow breath rather than a loop you can count */
      const s=Math.sin(t*0.42)*0.5+Math.sin(t*0.27+1.1)*0.5;
      seaFoam.position.z=SEA.shore+2+s*3.0;
      seaFoam.material.opacity=0.30+Math.abs(s)*0.22;
      seaFoam.material.map.offset.x=t*0.01;
    }
  });
}
let SKYOBJ=null;
function skyFollow(){
  if(!camera || !scene) return;
  if(!SKYOBJ){
    SKYOBJ=[];
    scene.children.forEach(o=>{
      if(o.name==='sky' || (o.isPoints && o.userData.stars))
        SKYOBJ.push({o:o, x:o.position.x, z:o.position.z});
    });
  }
  for(const s of SKYOBJ){ s.o.position.x=s.x+camera.position.x; s.o.position.z=s.z+camera.position.z; }
}
