// ============================================================================
// VISIT-KIT: mang bộ đồ nghề của game 2 (from0tohero) sang thế giới optimum-world - ĐI DẠO + BẮN SÚNG + NÉM LỰU ĐẠN TỰ DO (không sát thương, không giới hạn đạn).
// Có: nhảy (Space) · lướt (Shift) · đổi súng 1-4 (súng ngắn / súng dài / súng ngắm / lựu đạn) · nạp đạn (R) · ngắm (chuột phải, súng ngắm có kính)
//     · góc nhìn thứ nhất: tay + súng trước mặt · góc nhìn thứ 3 (C): súng trong tay, súng còn lại đeo sau lưng / hông như game 2.
// Bắn: chuột trái (súng ngắn / súng ngắm: mỗi lần bấm 1 viên · súng dài: giữ chuột để bắn liên thanh). Lựu đạn: giữ chuột = rút chốt, thả = ném (giữ lâu ném xa hơn).
// Có tia đạn, vết đạn, tia lửa, giật nòng, âm thanh, vụ nổ (quầng lửa, mảnh vụn, khói, vết cháy, rung màn hình). Chỉ nạp khi ?visit=1, sau soldier.js (xem visit-mode.js).
// Cách hoạt động: bọc renderer.render, mỗi khung hình (sau khi loop.js đã đặt camera + chân tay) mới chỉnh thêm nhảy / tay / súng. Không sửa file nào của game 1.
// Dữ liệu hình súng + chỗ đeo (GUN, SLING) lấy nguyên từ player/thirdperson.js của game 2.
// ============================================================================
window.VisitKit=(function(){
  const VB=Soldier.VB;
  const DK=0x3a3850,DK2=0x2b2a3a,GR=0x55536e;
  const GUN={
    pistol:{fg:[0,-.07,.02],parts:[[0,.045,.12,.05,.07,.26,DK,.02],[0,.04,.27,.03,.04,.04,0xff9a3c,.02],[0,-.05,-.01,.05,.13,.07,DK2,.02],[0,-.12,-.01,.055,.02,.075,0x4d9dff,.02]]},
    rifle:{fg:[0,-.04,.3],parts:[[0,.03,.22,.07,.1,.5,DK,.025],[0,.045,.66,.03,.03,.36,DK2,.015],[0,.0,.46,.06,.07,.3,GR,.025],[0,-.06,-.01,.05,.12,.06,DK2,.02],[0,-.1,.2,.05,.16,.07,0xf2b84b,.02],[0,.0,-.2,.06,.1,.3,DK2,.025],[0,.1,.2,.02,.03,.1,DK2,.015]]},
    sniper:{fg:[0,-.04,.4],parts:[[0,.03,.3,.065,.09,.75,DK,.025],[0,.035,.9,.025,.025,.4,DK2,.015],[0,.115,.25,.05,.05,.3,0x4d9dff,.02],[0,.115,.42,.065,.065,.04,0x7fbfff,.02],[0,-.01,-.22,.065,.1,.36,DK2,.025],[0,-.06,-.01,.05,.12,.06,DK2,.02],[0,-.08,.18,.04,.1,.06,DK,.02]]},
    grenade:{fg:null,parts:[[0,0,0,.08,.1,.08,0x4a7a3a,.02],[0,.065,0,.03,.03,.03,0xc9c9c9,.015],[.03,.07,0,.05,.012,.012,0xc9c9c9,.01]]}
  };
  // ---- chỗ đeo (toạ độ theo thân nhân vật, đơn vị m; chân ở y=0, lưng ở -z) ----
  const SLING={
    rifle:{p:[0,1.0,-.36],dir:[.55,.85,0],s:.85,mid:-.25},     // vắt chéo sau lưng: vai trái -> hông phải
    sniper:{p:[0,1.0,-.4],dir:[-.55,.85,0],s:.85,mid:-.3},     // chéo ngược lại, hai súng thành chữ X
    pistol:{p:[.275,.74,.02],dir:[0,-1,.05],s:1,mid:-.04},     // bao súng hông phải, báng chúc lên
    grenade:{p:[-.27,.8,.09],dir:[0,0,1],s:1,mid:0}            // móc ở hông trái
  };
  const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
  const ORDER=['pistol','rifle','sniper','grenade'];
  const NAME={pistol:'Súng ngắn',rifle:'Súng dài',sniper:'Súng ngắm',grenade:'Lựu đạn'};
  const MAG={pistol:12,rifle:30,sniper:5,grenade:3},RES={pistol:36,rifle:90,sniper:10,grenade:0};   // số liệu từ config.js game 2 (đạn trong băng đếm thật, đạn dự trữ vô hạn)
  const ZOOM={pistol:58,rifle:50,sniper:18,grenade:66};
    const TPH={pistol:[.3,1.32,.62],rifle:[.28,1.2,.5],sniper:[.28,1.2,.5],grenade:[.28,1.12,.42]};      // chỗ tay phải nắm súng (toạ độ thân nhân vật, góc nhìn thứ 3)
  const SH_R=V3(.336,1.344,0),SH_L=V3(-.336,1.344,0),DOWN=V3(0,-1,0),ZAX=V3(0,0,1);
  const _a=V3(0,0,0),_b=V3(0,0,0),_c=V3(0,0,0);
  const K={cur:'pistol',drawT:.35,relT:0,relMax:1.5,relFor:'pistol',ammo:{pistol:12,rifle:30,sniper:5},cd:0,gcd:0,fireHeld:false,kick:0,flashT:0,hold:-1,throwT:0,throwP:12,shake:0,aim:0,aimOn:false,jy:0,vy:0,slideT:0,slideCd:0,slK:0,sd:{x:0,z:0},t0:performance.now(),bob:0,mx:0,my:0,sx:0,sy:0,toastT:0,model:null,charKey:'vn',hooked:false};
  let held={},slung={},vm=null,hudEl=null,hudSlots=[],hudAmmo=null,toastEl=null,scopeEl=null;

  function gunMesh(t,mat){
    const v=new VB();GUN[t].parts.forEach(p=>v.box(p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],true));
    const m=v.mesh();if(mat){m.material=mat;m.renderOrder=1000;m.frustumCulled=false}return m;
  }
  // ---- giao diện nhỏ: thanh vũ khí + thông báo + kính ngắm ----
  function ui(){
    if(hudEl)return;
    const st=document.createElement('style');
    st.textContent='#vkHud{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff}'+
      '#vkHud .row{display:flex;gap:6px}#vkHud .s{padding:6px 10px;border-radius:10px;background:rgba(20,20,30,.6);opacity:.65}#vkHud .s.on{background:rgba(124,77,255,.9);opacity:1}'+
      '#vkHud .am{padding:3px 12px;border-radius:999px;background:rgba(20,20,30,.6);font-size:14px}'+
      '#vkToast{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:99997;padding:8px 16px;border-radius:999px;background:rgba(20,20,30,.8);color:#fff;font:600 14px system-ui,sans-serif;pointer-events:none;opacity:0;transition:opacity .25s}'+
      '#vkScope{position:fixed;inset:0;z-index:50;pointer-events:none;display:none;background:radial-gradient(circle at 50% 50%,transparent 0,transparent 24vmin,#000 24.6vmin)}'+
      '#vkScope::before,#vkScope::after{content:"";position:absolute;background:#000}#vkScope::before{left:0;right:0;top:calc(50% - 1px);height:2px}#vkScope::after{top:0;bottom:0;left:calc(50% - 1px);width:2px}';
    document.head.appendChild(st);
    hudEl=document.createElement('div');hudEl.id='vkHud';
    const row=document.createElement('div');row.className='row';
    ORDER.forEach((t,i)=>{const d=document.createElement('div');d.className='s';d.textContent=(i+1)+' '+NAME[t];row.appendChild(d);hudSlots.push(d)});
    hudAmmo=document.createElement('div');hudAmmo.className='am';
    hudEl.append(row,hudAmmo);document.body.appendChild(hudEl);
    toastEl=document.createElement('div');toastEl.id='vkToast';document.body.appendChild(toastEl);
    scopeEl=document.createElement('div');scopeEl.id='vkScope';document.body.appendChild(scopeEl);
    hud();
  }
  function hud(){
    if(!hudEl)return;
    ORDER.forEach((t,i)=>hudSlots[i].className='s'+(t===K.cur?' on':''));
    const t=K.cur;
    hudAmmo.textContent=K.relT>0?'⟳ Đang nạp đạn…':(t==='grenade'?'💣 ∞':K.ammo[t]+' / ∞');
  }
  function toast(msg){
    if(!toastEl)return;toastEl.textContent=msg;toastEl.style.opacity='1';K.toastT=1.6;
  }
  // ---- góc nhìn thứ nhất: CHÉP NGUYÊN từ game gốc (player/player.js + player/weapons.js + player/viewmodel.js) ----
  // Tay + súng vẽ ở lượt riêng (layer 1) sau khi vẽ thế giới, xoá depth -> không bị tường che, không bị tone mapping của thế giới làm nhạt.
  // Vật liệu tự viết (đèn bán cầu + đèn mặt trời cố định như game gốc) nên màu luôn đậm, không phụ thuộc ánh sáng / sương mù của thế giới này.
  const chk=(a,b)=>(i,j,k)=>((i+j+k)&1)?a:b;
  const DKC=chk(0x3a3850,0x2b2a3a),YLC=chk(0xf2b84b,0xffd76a);
  let vmMat=null,GLASS_M=null,GLASS_G=null,FPW={};
  function fpArm(fp,x,y,z,rx,ry,left){
    const g=new THREE.Group(),v=new VB(),CS=fp;
    const SKT=CS.glove?[CS.glove,CS.glove]:CS.skin,SK=chk(SKT[0],SKT[1]),NAIL=CS.glove?CS.glove:0xfff0e8;
    v.box(0,0,.43,.17,.17,.66,CS.sleeve,.03,true);
    v.box(0,0,.1,.19,.19,.06,CS.cuff,.02,true);
    v.box(0,0,.19,.18,.18,.05,CS.band,.02,true);
    v.box(0,.1,.19,.13,.03,.08,0x2b2a3a,.015);v.box(0,.118,.19,.09,.008,.05,0x7fdfff,.01);
    v.box(0,0,0,.15,.13,.12,SK,.02,true);
    for(let f=0;f<4;f++){const yy=.045-.03*f;v.box(0,yy,-.085,.13,.028,.05,SK,.014);v.box(0,yy,-.113,.09,.02,.006,NAIL,.006)}
    v.box(-.09,.03,-.01,.05,.05,.11,SK,.016);v.box(-.09,.03,-.068,.03,.03,.006,NAIL,.006);
    v.box(0,.068,-.01,.13,.012,.1,CS.glove||CS.band,.012);
    g.add(v.mesh());g.position.set(x,y,z);g.rotation.set(rx,ry,0);if(left)g.scale.x=-1;return g;
  }
  function voxPin(s,cx,cy,cz){s.cyl(cx-.035,cy+.115,cz,.03,.01,0xd8d8e0,.01,'z',.02);s.box(cx-.005,cy+.115,cz,.03,.01,.01,0xd8d8e0,.008)}
  function voxGrenade(s,cx,cy,cz,pin){
    s.ell(cx,cy,cz,.058,.075,.058,(i,j,k)=>(i%3===0||j%3===0||k%3===0)?0x3f5a2c:0x6b8a45,.018);
    s.cyl(cx,cy+.062,cz,.03,.012,0xffc93a,.012,'y');
    s.cyl(cx,cy+.085,cz,.022,.03,0x8a8f96,.012,'y');s.cyl(cx,cy+.11,cz,.017,.025,0x5b6068,.012,'y');
    if(pin)voxPin(s,cx,cy,cz);
    s.box(cx+.05,cy+.09,cz,.06,.014,.03,0xa9adb5,.01);s.box(cx+.068,cy+.02,cz,.012,.15,.03,0xa9adb5,.01);
  }
  function scopeLens(x,y,z,r){const m=new THREE.Mesh(GLASS_G,GLASS_M);m.scale.setScalar(r);m.position.set(x,y,z);m.renderOrder=3;m.userData.glass=true;return m}
  function bPistol(G,MG,SL,fp){
    const f=new VB(),s=new VB(),m=new VB();
    G.add(fpArm(fp,.24,-.3,-.45,.35,.18));
    s.box(.22,-.14,-.64,.085,.07,.44,(i,j,k,nx,ny,nz)=>j===ny-1?0xe9eef5:(k>=nz-5&&(k&1))?0x9aa6b8:0xf4f7fb,.02);
    s.box(.22,-.103,-.66,.03,.012,.3,0xff8a2a,.012);
    s.box(.22,-.09,-.83,.018,.026,.02,0xff6a1a,.01);
    s.box(.203,-.093,-.45,.014,.03,.02,0x2b2a3a,.01);s.box(.237,-.093,-.45,.014,.03,.02,0x2b2a3a,.01);
    s.box(.2655,-.135,-.6,.006,.03,.09,0x2b2a3a,.008);
    s.box(.22,-.14,-.868,.04,.035,.016,0x2b2a3a,.01);
    s.box(.22,-.108,-.418,.02,.03,.02,0x2b2a3a,.01);
    f.box(.22,-.2,-.62,.075,.05,.4,chk(0x5a6b85,0x4b5b75),.02);
    f.box(.22,-.2,-.815,.078,.052,.03,0xff8a2a,.015);
    f.box(.22,-.262,-.56,.03,.012,.12,0x3a4358,.012);f.box(.22,-.236,-.615,.03,.05,.012,0x3a4358,.012);
    f.box(.22,-.235,-.5,.014,.04,.014,0x2b2a3a,.01);
    for(let k=0;k<5;k++)f.box(.22,-.24-.033*k,-.455+.011*k,.072,.035,.085,chk(0xff8a2a,0x3a4358),.017);
    m.box(0,0,0,.066,.075,.078,chk(0x4d9dff,0x3a7fe0),.016);m.box(0,-.043,0,.078,.014,.09,0xff8a2a,.014);
    MG.position.set(.22,-.425,-.415);
    G.add(f.mesh());SL.add(s.mesh());MG.add(m.mesh());
    return {la:fpArm(fp,-.28,-.7,-.4,.5,-.3,true),lt:V3(.2,-.45,-.47),mz:[.22,-.14,-.9],sg:V3(.17,-.11,-.42)};
  }
  function bRifle(G,MG,SL,fp){
    const f=new VB(),s=new VB(),m=new VB();
    G.add(fpArm(fp,.2,-.3,-.42,.4,.15));
    f.box(.14,-.19,-.6,.1,.1,.52,YLC,.026);
    f.box(.192,-.19,-.6,.008,.04,.3,0x4d9dff,.01);f.box(.088,-.19,-.6,.008,.04,.3,0x4d9dff,.01);
    f.box(.14,-.25,-.56,.09,.03,.36,DKC,.02);
    f.box(.14,-.195,-1.06,.09,.09,.42,DKC,.022);
    f.box(.14,-.195,-.92,.1,.1,.03,0xff9a3c,.02);f.box(.14,-.195,-1.24,.1,.1,.03,0xff9a3c,.02);
    f.cyl(.14,-.195,-1.44,.02,.3,DKC,.012,'z');
    f.cyl(.14,-.195,-1.61,.03,.05,0xffd23f,.014,'z');
    f.cyl(.14,-.125,-1.38,.028,.014,0x2b2a3a,.01,'z',.016);f.box(.14,-.165,-1.38,.014,.024,.014,0x2b2a3a,.01);
    f.cyl(.14,-.105,-.72,.03,.014,0x2b2a3a,.01,'z',.018);f.box(.14,-.138,-.72,.016,.012,.016,0x2b2a3a,.01);
    for(let k=0;k<5;k++)f.box(.14,-.29-.03*k,-.44+.012*k,.06,.03,.075,chk(0x3a3850,0xff9a3c),.015);
    f.box(.14,-.2,-.31,.07,.1,.14,DKC,.024);
    s.box(.14,-.13,-.6,.075,.024,.4,DKC,.02);s.box(.2,-.17,-.66,.03,.03,.05,0xff9a3c,.015);
    for(let k=0;k<5;k++)m.box(0,-.032*k,-.006*k*k,.05,.034,.075,k===4?0xff9a3c:YLC,.017);
    MG.position.set(.14,-.29,-.62);
    G.add(f.mesh());SL.add(s.mesh());MG.add(m.mesh());
    return {la:fpArm(fp,.06,-.3,-.95,.4,-.2,true),lt:V3(.14,-.44,-.62),mz:[.14,-.195,-1.66],sg:V3(.1,-.12,-.46)};
  }
  function bSniper(G,MG,SL,fp){
    const f=new VB(),s=new VB(),m=new VB();
    G.add(fpArm(fp,.2,-.3,-.42,.4,.15));
    f.box(.14,-.2,-.7,.09,.12,.7,DKC,.024);
    f.box(.187,-.2,-.72,.008,.07,.4,0x4d9dff,.01);f.box(.093,-.2,-.72,.008,.07,.4,0x4d9dff,.01);
    f.cyl(.14,-.195,-1.55,.025,.9,DKC,.014,'z');
    f.cyl(.14,-.195,-1.3,.03,.03,0xffd23f,.014,'z');f.cyl(.14,-.195,-1.6,.03,.03,0xffd23f,.014,'z');
    f.cyl(.14,-.195,-2.05,.035,.12,(a,b,l)=>l&1?0xffd23f:0xf2b84b,.014,'z');
    f.box(.14,-.235,-1.25,.075,.05,.4,chk(0x4d9dff,0x3a7fe0),.02);
    f.cyl(.14,-.1,-.78,.032,.42,DKC,.016,'z');
    f.cyl(.14,-.1,-.98,.045,.1,0x2b2a3a,.016,'z');
    f.cyl(.14,-.1,-.54,.04,.08,0x2b2a3a,.016,'z');
    f.cyl(.14,-.058,-.78,.014,.03,0xffd23f,.01,'y');f.cyl(.174,-.1,-.78,.014,.03,0xffd23f,.01,'x');
    f.box(.14,-.145,-.68,.04,.05,.05,DKC,.014);f.box(.14,-.145,-.88,.04,.05,.05,DKC,.014);
    for(let k=0;k<5;k++)f.box(.14,-.29-.03*k,-.42+.012*k,.06,.03,.075,chk(0x3a3850,0x4d9dff),.015);
    f.box(.14,-.18,-.24,.075,.15,.18,DKC,.024);f.box(.14,-.11,-.26,.06,.03,.12,0x4d9dff,.015);
    G.add(scopeLens(.14,-.1,-.496,.036),scopeLens(.14,-.1,-1.036,.042));
    s.box(.19,-.15,-.55,.05,.02,.02,0xc9c9d6,.012);s.cyl(.225,-.15,-.55,.016,.03,0xffd23f,.012,'x');
    m.box(0,0,0,.07,.1,.1,YLC,.02);
    MG.position.set(.14,-.31,-.72);
    G.add(f.mesh());SL.add(s.mesh());MG.add(m.mesh());
    return {la:fpArm(fp,.06,-.3,-1.0,.4,-.2,true),lt:V3(.14,-.42,-.72),mz:[.14,-.195,-2.14],sg:V3(.22,-.13,-.5),ads:V3(-.14,.1,.43)};
  }
  function bGrenade(G,MG,SL,fp){
    const s=new VB(),p=new VB(),PN=new THREE.Group();
    G.add(fpArm(fp,.2,-.3,-.42,.4,.15));
    voxGrenade(s,.2,-.22,-.5,false);voxPin(p,.2,-.22,-.5);
    SL.add(s.mesh());PN.add(p.mesh());G.add(PN);
    const la=fpArm(fp,-.28,-.7,-.4,.5,-.3,true);la.visible=false;
    return {la,pn:PN,lt:V3(0,0,0),mz:[.2,-.2,-.6]};
  }
  const ADSV={pistol:[-.2,.1,.15],rifle:[-.13,.1,.2]};   // ngắm bằng chuột phải (không phải súng ngắm): đưa súng vào giữa màn hình
  function buildVM(key){
    GLASS_M=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.72,depthWrite:false});GLASS_G=new THREE.CircleGeometry(1,28);
    vmMat=new THREE.ShaderMaterial({vertexColors:true,uniforms:{uUp:{value:V3(0,1,0)},uSun:{value:V3(.4,.8,.3)}},
      vertexShader:'varying vec3 vC,vN;void main(){vC=color;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform vec3 uUp,uSun;varying vec3 vC,vN;void main(){vec3 n=normalize(vN);float h=dot(n,uUp)*.5+.5;vec3 hemi=mix(vec3(1.,.839,.902),vec3(1.),h)*1.05;float d=max(dot(n,uSun),0.)*.5;gl_FragColor=vec4(vC*(hemi+d)+vec3(.118),1.);}'});   // = đèn bán cầu 1.05 + mặt trời .5 + emissive .118 của game gốc
    vm=new THREE.Group();vm.visible=false;
    const fp=Soldier.fp(key),B={pistol:bPistol,rifle:bRifle,sniper:bSniper,grenade:bGrenade};
    FPW={};
    ORDER.forEach(t=>{
      const root=new THREE.Group(),G=new THREE.Group(),MG=new THREE.Group(),SL=new THREE.Group();G.add(MG,SL);root.add(G);
      const wb=B[t](G,MG,SL,fp);root.add(wb.la);
      const f=flashMesh(true);f.position.set(wb.mz[0],wb.mz[1],wb.mz[2]);f.scale.set(1.2,1.2,1.2);G.add(f);flashFp[t]=f;
      const w=Object.assign(wb,{root,G,MG,SL,lb:wb.la.position.clone(),mb:MG.position.clone(),pistol:t==='pistol'||t==='grenade'});
      w.ho=V3(wb.lt.x-w.mb.x,(wb.lt.y-w.mb.y)*.5,wb.lt.z-w.mb.z);
      root.visible=false;vm.add(root);FPW[t]=w;
    });
    camera.add(vm);
    vm.traverse(o=>{o.layers.set(1);if(o.isMesh){o.frustumCulled=false;if(!o.userData.glass&&!o.userData.vkfx)o.material=vmMat}});
  }
  const _v1=V3(0,0,0),_v3=V3(0,0,0),_v5=V3(0,0,0),POUCH=V3(-.32,-.45,.3),MDN=.25;
  const e3=x=>x*x*(3-2*x),cl3=(u,a,b)=>Math.min(1,Math.max(0,(u-a)/(b-a)));
  function magPath(g,u,out){
    const mb=g.mb,dn=_v5.copy(mb),po=_v3.copy(mb).add(POUCH);dn.y-=MDN;
    if(u<.30)return out.lerpVectors(mb,dn,e3(cl3(u,.12,.30)));
    if(u<.48)return out.lerpVectors(dn,po,e3(cl3(u,.30,.48)));
    if(u<.60)return out.lerpVectors(po,dn,e3(cl3(u,.48,.60)));
    return out.lerpVectors(dn,mb,e3(cl3(u,.60,.72)));
  }
  function fpUpdate(dt,moving,visible){
    vm.visible=visible;
    if(!visible)return;
    const t=K.cur,g=FPW[t],G=g.G;
    ORDER.forEach(u=>FPW[u].root.visible=(u===t));
    K.bob+=dt*(moving?9:2);
    const bobY=moving?Math.sin(K.bob)*.012:Math.sin(K.bob)*.003,bobX=moving?Math.cos(K.bob*.5)*.008:0;
    K.sx+=(Math.max(-1,Math.min(1,K.mx*.02))-K.sx)*Math.min(1,dt*8);K.sy+=(Math.max(-1,Math.min(1,K.my*.02))-K.sy)*Math.min(1,dt*8);K.mx=K.my=0;
    const draw=K.drawT>0?K.drawT/.35:0;
    vm.position.set(bobX-K.sx*.03,bobY-draw*.45+K.sy*.02,0);   // game gốc: -.35 chỉ là giá trị khởi tạo, sau đó main.js kéo về ~0 (chỉ còn nhún khi chạy)
    vm.rotation.set(K.sy*.04,K.sx*.05,0);
    for(const u in flashFp)flashFp[u].visible=(u===t&&K.flashT>0);
    if(t==='grenade'){
      g.la.visible=false;g.MG.visible=false;
      if(K.throwT>0){const u=1-K.throwT/.22,tt=e3(Math.min(1,u/.8));G.position.set(.04*(1-tt),.14-.26*tt,.3-.7*tt);G.rotation.set(.55-1.05*tt,0,0);g.SL.visible=true;g.pn.visible=false}
      else if(K.hold>=0){
        const w=e3(Math.min(1,K.hold/.25)),u=Math.min(1,K.hold/.6);
        G.position.set(.04*w,.14*w,.3*w);G.rotation.set(.55*w,0,0);g.SL.visible=true;
        const pl=e3(cl3(u,.45,.7)),pulled=u>=.7;g.pn.position.x=-.16*pl;g.pn.visible=!pulled;
        if(u<.1)g.la.visible=false;
        else{g.la.visible=u<1;G.updateMatrix();_v1.set(.165,-.105,-.5).applyMatrix4(G.matrix).add(_v3.set(-.03,-.06,.07));
          const h=g.la.position;h.lerpVectors(g.lb,_v1,e3(cl3(u,.1,.45)));h.x-=.16*pl;h.lerp(g.lb,e3(cl3(u,.78,1)))}
      }else{G.position.set(0,0,0);G.rotation.set(0,0,0);g.SL.visible=!(K.gcd>0);g.pn.visible=!(K.gcd>0);g.pn.position.x=0}
      return;
    }
    let sl=0;
    if(K.relT>0){
      const u=Math.min(1,1-K.relT/K.relMax),tl=e3(cl3(u,0,.12))*(1-e3(cl3(u,.74,.86)));
      G.rotation.set(.35*tl,0,-.5*tl);G.position.set(-.06*tl,-.12*tl,.015*Math.sin(Math.PI*cl3(u,.72,.78)));G.updateMatrix();
      magPath(g,u,g.MG.position);g.MG.visible=u<.3||u>=.48;
      const sm=t==='pistol'?.07:t==='sniper'?.1:.08;sl=sm*e3(cl3(u,.82,.9))*(1-e3(cl3(u,.92,.95)));
      g.la.visible=true;const h=g.la.position;
      if(u<.12)h.lerpVectors(g.lb,_v1.copy(g.MG.position).add(g.ho).applyMatrix4(G.matrix),e3(cl3(u,0,.12)));
      else if(u<.72)h.copy(g.MG.position).add(g.ho).applyMatrix4(G.matrix);
      else if(u<.82)h.lerpVectors(_v1.copy(g.mb).add(g.ho),g.sg,e3(cl3(u,.72,.82))).applyMatrix4(G.matrix);
      else if(u<.95){h.copy(g.sg);h.z+=sl;h.applyMatrix4(G.matrix)}
      else h.lerpVectors(_v1.copy(g.sg).applyMatrix4(G.matrix),g.lb,e3(cl3(u,.95,1)));
    }else{
      G.rotation.set(0,0,0);G.position.set(0,0,0);g.MG.visible=true;g.MG.position.copy(g.mb);
      g.la.position.copy(g.lb);g.la.visible=!g.pistol;
      if(K.kick>0)sl=(t==='pistol'?.04:t==='sniper'?.1:.05)*Math.sin(Math.PI*(1-Math.min(1,K.kick)));
    }
    g.SL.position.z=sl;
    const a=K.aim,av=t==='sniper'?g.ads:(ADSV[t]?V3(ADSV[t][0],ADSV[t][1],ADSV[t][2]):null);
    if(av&&a>0&&K.relT<=0){
      const x=e3(Math.min(1,a/.7)),z=e3(cl3(a,.3,1));
      G.position.x+=av.x*x;G.position.y+=av.y*x;G.position.z+=av.z*z;
      g.la.position.x+=av.x*x;g.la.position.y+=av.y*x;g.la.position.z+=av.z*z;
    }
    G.position.z+=K.kick*.06;G.rotation.x-=K.kick*.1;
  }
  // ---- góc nhìn thứ 3: súng trong tay + súng đeo ----
  function attach(m,key){
    ui();K.model=m;K.charKey=key||K.charKey;held={};slung={};
    ORDER.forEach(t=>{const g=new THREE.Group();g.add(gunMesh(t));if(MUZ[t]){const f=flashMesh(false);f.position.set(0,.045,MUZ[t]);g.add(f);flashTp[t]=f}g.visible=false;m.g.add(g);held[t]=g});
    ORDER.forEach(t=>{
      const c=SLING[t],g=new THREE.Group(),mesh=gunMesh(t);mesh.position.z=c.mid;g.add(mesh);
      g.position.set(c.p[0],c.p[1],c.p[2]);g.scale.setScalar(c.s);
      g.quaternion.setFromUnitVectors(ZAX,V3(c.dir[0],c.dir[1],c.dir[2]).normalize());m.g.add(g);slung[t]=g;
    });
    const hv=new VB();hv.box(.275,.7,.02,.085,.17,.115,0x1d1d22,.025,true);const hs=hv.mesh();m.g.add(hs);   // bao súng ở hông phải
    if(!vm)buildVM(K.charKey);
    hook();
  }
  function aimArm(arm,sh,tgt){_a.copy(tgt).sub(sh).normalize();arm.quaternion.setFromUnitVectors(DOWN,_a)}
  function tpUpdate(dt){
    const m=K.model;if(!m)return;
    const t=K.cur,h=held[t];
    ORDER.forEach(u=>{held[u].visible=(u===t);slung[u].visible=(u!==t)});
    const hp=TPH[t];h.position.set(hp[0],hp[1],hp[2]);
    let tilt=0;if(K.relT>0)tilt=Math.sin((1-K.relT/K.relMax)*Math.PI);
    const pit=(typeof player!=='undefined'&&player)?player.pitch:0;
    h.rotation.set(-pit*.7+tilt*.4,0,-tilt*.5);h.updateMatrix();
    aimArm(m.armR,SH_R,h.position);
    for(const u in flashTp)flashTp[u].visible=(u===t&&K.flashT>0);
    const fg=GUN[t].fg;
    if(fg){_b.set(fg[0],fg[1],fg[2]).applyMatrix4(h.matrix);if(K.relT>0)_b.y-=tilt*.18;aimArm(m.armL,SH_L,_b)}
  }
  // ======================= BẮN SÚNG + NÉM LỰU ĐẠN (tự do, không sát thương, không giới hạn đạn) =======================
  // Số liệu súng lấy từ config.js game 2: tốc độ bắn (rate, giây/viên), tự động (auto), độ lệch (sp), thời gian nạp (rl), cỡ băng (mag).
  const FIRE={pistol:{rate:.26,auto:false,sp:0,rl:1.6,mag:12,dmg:34,hd:100},rifle:{rate:.09,auto:true,sp:.012,rl:2.3,mag:30,dmg:20,hd:60},sniper:{rate:1.2,auto:false,sp:.05,rl:3.2,mag:5,dmg:100,hd:100}};
  const MUZ={pistol:.3,rifle:.85,sniper:1.12};   // vị trí đầu nòng dọc theo thân súng (toạ độ súng)
  const RC=new THREE.Raycaster(),_col=new THREE.Color(),_m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_sc=V3(1,1,1),_p3=V3(0,0,0);
  let flashFp={},flashTp={},FXM=null,tracers=[],holes=[],blasts=[],scorches=[],thrown=[],fxN=0;
  const FXMAX=700,FXD=[];for(let i=0;i<FXMAX;i++)FXD.push({life:0});

  // ---- âm thanh tổng hợp (WebAudio, dùng lại SFX của game 1; không cần file âm thanh) ----
  const SND={pistol:[1.5,.5,2600,.14,150],rifle:[1.1,.55,2100,.17,0],sniper:[.55,.9,1500,.5,140],boom:[.28,1.15,450,1.0,85],pin:[3,.1,6000,.05,0],click:[2.2,.14,5000,.04,0],dry:[4,.12,7000,.03,0]};
  function sfx(kind,gain){
    try{
      if(typeof SFX==='undefined'||!SFX.ctx||!SFX.master||!SFX.noise)return;
      const c=SFX.ctx;if(c.state==='suspended')c.resume();
      const d=SND[kind],t=c.currentTime,src=c.createBufferSource(),lp=c.createBiquadFilter(),g=c.createGain(),vol=d[1]*(gain==null?1:gain);
      src.buffer=SFX.noise;src.playbackRate.value=d[0];lp.type='lowpass';lp.frequency.value=d[2];
      g.gain.setValueAtTime(Math.max(.002,vol),t);g.gain.exponentialRampToValueAtTime(.001,t+d[3]);
      src.connect(lp);lp.connect(g);g.connect(SFX.master);src.start(t);src.stop(t+d[3]+.05);
      if(d[4]){const o=c.createOscillator(),og=c.createGain();o.type='sine';o.frequency.setValueAtTime(d[4],t);o.frequency.exponentialRampToValueAtTime(35,t+.25);
        og.gain.setValueAtTime(Math.max(.002,vol*.8),t);og.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(og);og.connect(SFX.master);o.start(t);o.stop(t+.35)}
    }catch(e){}
  }

  // ---- hiệu ứng: hạt voxel (tia lửa / mảnh vụn / khói), tia đạn, vết đạn, vụ nổ ----
  function fxInit(){
    if(FXM||typeof scene==='undefined'||!scene)return;
    FXM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({fog:true}),FXMAX);
    FXM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);FXM.frustumCulled=false;FXM.userData.vkfx=true;FXM.setColorAt(0,new THREE.Color());FXM.count=0;scene.add(FXM);
  }
  // g: trọng lực (âm = bay lên, dùng cho khói)
  function spark(x,y,z,vx,vy,vz,life,sz,col,g){
    const d=FXD[fxN=(fxN+1)%FXMAX];d.x=x;d.y=y;d.z=z;d.vx=vx;d.vy=vy;d.vz=vz;d.life=d.max=life;d.sz=sz;d.col=col;d.g=g;
  }
  function fxUpdate(dt){
    if(!FXM)return;let n=0;
    for(let i=0;i<FXMAX;i++){
      const d=FXD[i];if(d.life<=0)continue;
      d.life-=dt;if(d.life<=0)continue;
      d.vy-=d.g*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;
      if(d.y<.04&&d.g>0){d.y=.04;d.vy*=-.35;d.vx*=.6;d.vz*=.6}
      const k=d.g<0?d.sz*(1+(1-d.life/d.max)*1.6):d.sz*Math.min(1,d.life/d.max*2.2);   // khói nở ra, mảnh vụn nhỏ dần
      _sc.set(k,k,k);_p3.set(d.x,d.y,d.z);_m4.compose(_p3,_q.identity(),_sc);FXM.setMatrixAt(n,_m4);_col.setHex(d.col);FXM.setColorAt(n,_col);n++;
    }
    FXM.count=n;FXM.instanceMatrix.needsUpdate=true;if(FXM.instanceColor)FXM.instanceColor.needsUpdate=true;
    for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.life-=dt;t.m.material.opacity=Math.max(0,t.life/.07)*.9;if(t.life<=0){t.m.visible=false}}
    for(const h of holes){if(h.life>0){h.life-=dt;h.m.material.opacity=Math.min(.75,h.life/2);if(h.life<=0)h.m.visible=false}}
    for(const s of scorches){if(s.life>0){s.life-=dt;s.m.material.opacity=Math.min(.5,s.life/4);if(s.life<=0)s.m.visible=false}}
    for(const b of blasts){if(b.life>0){b.life-=dt;const k=1-b.life/.35;b.m.scale.setScalar(Math.max(.1,b.R*(1-(1-k)*(1-k))));b.m.material.opacity=.8*Math.max(0,b.life/.35);if(b.life<=0)b.m.visible=false}}
  }
  function poolMesh(arr,max,make){let o=arr.find(x=>x.life<=0);if(!o){if(arr.length<max){o={m:make(),life:0};o.m.userData.vkfx=true;scene.add(o.m);arr.push(o)}else{o=arr.reduce((a,b)=>a.life<b.life?a:b)}}return o}
  const mkTracer=()=>new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  const mkHole=()=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.2,.2),new THREE.MeshBasicMaterial({color:0x15151c,transparent:true,opacity:.75,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide}));return m};
  const mkBlast=()=>new THREE.Mesh(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({color:0xffa238,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  const mkScorch=()=>new THREE.Mesh(new THREE.CircleGeometry(2.4,20),new THREE.MeshBasicMaterial({color:0x101014,transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  function tracer(a,b){
    const o=poolMesh(tracers,10,mkTracer),len=Math.max(.1,a.distanceTo(b));
    o.m.visible=true;o.life=.07;o.m.position.copy(a).add(b).multiplyScalar(.5);o.m.lookAt(b);o.m.scale.set(.022,.022,len);o.m.material.opacity=.9;
  }
  function bulletHole(p,n){
    const o=poolMesh(holes,40,mkHole);o.m.visible=true;o.life=12;o.m.position.copy(p).addScaledVector(n,.015);o.m.lookAt(_p3.copy(p).add(n));o.m.material.opacity=.75;
  }

  // ---- bắn ----
  const okHit=o=>{
    if(!o.isMesh||o.userData.vkfx)return false;
    const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m||m.depthWrite===false||m.depthTest===false)return false;   // bỏ qua mây, tia sáng, hiệu ứng, tay súng
    for(let p=o;p;p=p.parent){if(p.visible===false)return false;if(avatar&&p===avatar)return false}
    return true;
  };
  function muzzlePos(t,out){
    const tp=!!(avatar&&avatar.visible);
    if(tp&&flashTp[t]){flashTp[t].parent.updateWorldMatrix(true,false);return flashTp[t].getWorldPosition(out)}
    camera.updateMatrixWorld(true);if(flashFp[t])return flashFp[t].getWorldPosition(out);return out.set(.18,-.16,-1.05).applyMatrix4(camera.matrixWorld);
  }
  function shoot(){
    const t=K.cur,F=FIRE[t];if(!F||K.cd>0||K.relT>0||K.drawT>0)return;
    if(K.ammo[t]<=0){sfx('dry');K.cd=.3;reload();return}
    fxInit();
    K.ammo[t]--;K.cd=F.rate;K.flashT=.05;K.kick=1;hud();
    sfx(t);
    if(typeof player!=='undefined'&&player)player.pitch=Math.min(1.3,player.pitch+(t==='sniper'?.05:t==='rifle'?.012:.02));   // giật nòng
    const sp=(t==='sniper'&&K.aim>.6)?0:F.sp;
    RC.setFromCamera({x:(Math.random()-.5)*sp*2,y:(Math.random()-.5)*sp*2},camera);RC.far=110;
    camera.updateMatrixWorld();
    const hits=RC.intersectObjects(scene.children,true);
    let h=null;for(const x of hits){if(okHit(x.object)){h=x;break}}
    const from=muzzlePos(t,V3(0,0,0)),to=h?h.point.clone():RC.ray.at(80,V3(0,0,0));
    tracer(from,to);
    if(h){
      const n=h.face?h.face.normal.clone().transformDirection(h.object.matrixWorld):V3(0,1,0);
      if(n.dot(RC.ray.direction)>0)n.negate();
      const mat=Array.isArray(h.object.material)?h.object.material[0]:h.object.material,c=(mat&&mat.color)?mat.color.getHex():0xcccccc;
      let rb=null;for(let o=h.object;o&&!rb;o=o.parent)if(o.userData&&o.userData.rbot)rb=o.userData.rbot;
      if(rb){
        const head=h.point.y>1.55;botHit(rb,head?F.hd:F.dmg);
        for(let i=0;i<7;i++)spark(h.point.x,h.point.y,h.point.z,(Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5,.3+Math.random()*.25,.05+Math.random()*.05,0xc0202e,18);
      }else{
      bulletHole(h.point,n);
      for(let i=0;i<9;i++)spark(h.point.x,h.point.y,h.point.z,n.x*3+(Math.random()-.5)*5,n.y*3+Math.random()*4,n.z*3+(Math.random()-.5)*5,.35+Math.random()*.3,.04+Math.random()*.05,i%3?c:0xffe27a,18);
      }
    }
  }
  function reload(){
    const t=K.cur,F=FIRE[t];if(!F||K.relT>0||K.ammo[t]>=F.mag)return;
    K.relFor=t;K.relMax=F.rl;K.relT=F.rl;sfx('click');hud();
  }

  // ---- lựu đạn: giữ chuột = rút chốt, thả = ném (giữ càng lâu ném càng xa) ----
  function gPin(){if(K.gcd>0||K.hold>=0||K.throwT>0)return;K.hold=0;sfx('pin')}
  function gRelease(){if(K.hold<0)return;K.throwP=11+5*Math.min(1,K.hold/1);K.hold=-1;K.throwT=.22;K.kick=1.2}
  const GREN_LINE='Optimum fire in the house';   // câu thoại như game 2
  function say(){
    toast('🗣️ "'+GREN_LINE+'"');
    try{const ss=window.speechSynthesis;if(!ss)return;ss.cancel();const u=new SpeechSynthesisUtterance(GREN_LINE);u.lang='en-US';u.rate=1;u.pitch=.9;u.volume=1;ss.speak(u)}catch(e){}
  }
  function launch(pw){
    fxInit();
    const d=V3(0,0,0);camera.getWorldDirection(d);
    const m=gunMesh('grenade');m.scale.setScalar(1.8);m.userData.vkfx=true;scene.add(m);
    thrown.push({x:camera.position.x+d.x*.6,y:Math.max(.2,camera.position.y-.3+d.y*.6),z:camera.position.z+d.z*.6,vx:d.x*pw,vy:d.y*pw+3,vz:d.z*pw,t:2,m});
    K.gcd=.8;say();sfx('click');
  }
  function explode(g){
    fxInit();
    const cx=g.x,cy=g.y+.2,cz=g.z,dist=Math.hypot(camera.position.x-cx,camera.position.y-cy,camera.position.z-cz);
    sfx('boom',1/(1+dist/22));
    const b=poolMesh(blasts,3,mkBlast);b.m.visible=true;b.life=.35;b.R=6;b.m.position.set(cx,cy,cz);b.m.scale.setScalar(.1);
    if(g.y<1.5){const s=poolMesh(scorches,6,mkScorch);s.m.visible=true;s.life=20;s.m.position.set(cx,.03,cz);s.m.rotation.x=-Math.PI/2;s.m.material.opacity=.5}
    for(let i=0;i<72;i++)spark(cx,cy,cz,(Math.random()-.5)*24,Math.random()*16,(Math.random()-.5)*24,.6+Math.random()*.6,.08+Math.random()*.12,i%2?0xff9a3c:0xffe066,22);
    for(let i=0;i<14;i++)spark(cx+(Math.random()-.5)*1.5,cy,cz+(Math.random()-.5)*1.5,(Math.random()-.5)*2.5,2+Math.random()*3,(Math.random()-.5)*2.5,1.2+Math.random()*.9,.5+Math.random()*.5,i%2?0x8a8f99:0x6c717c,-1.2);   // khói
    K.shake=Math.max(K.shake,Math.min(1,9/(dist+4)));
    for(const b of RBOT.list.slice()){const bd=Math.hypot(b.x-cx,b.z-cz);if(bd<10)botHit(b,160*(1-bd/10))}   // sát thương nổ như game 2: bán kính 10m
  }
  function grenTick(dt){
    for(let i=thrown.length-1;i>=0;i--){
      const g=thrown[i];g.t-=dt;g.vy-=22*dt;
      const nx=g.x+g.vx*dt,nz=g.z+g.vz*dt;
      if(blocked(nx,g.z))g.vx*=-.4;else g.x=nx;
      if(blocked(g.x,nz))g.vz*=-.4;else g.z=nz;
      g.y+=g.vy*dt;
      if(g.y<=.12){g.y=.12;if(g.vy<-2)g.vy=-g.vy*.4;else g.vy=0;const f=Math.pow(.1,dt);g.vx*=f;g.vz*=f}
      g.m.position.set(g.x,g.y,g.z);g.m.rotation.x+=dt*6;g.m.rotation.z+=dt*4;
      if(g.t<=0){scene.remove(g.m);thrown.splice(i,1);explode(g)}
    }
  }
  // ======================= BOT ĐUỔI THEO QUA CỔNG (từ Block Arena sang) =======================
  // Bot chạy ra từ cổng, đuổi theo người chơi, bắn tia đạn + cận chiến (chỉ hiệu ứng: chớp đỏ, không trừ máu, không chết người chơi).
  // Người chơi hạ được bằng đạn (đầu ăn nhiều sát thương hơn) và lựu đạn. Khi người chơi bước qua cổng về lại Block Arena,
  // bot còn sống gần cổng chạy theo (xem takeBots + visit-portal.js).
  const RBOT={list:[],n:0};
  // Mô hình bot GỐC của game 2 (entities/bot-model.js): bộ đồ đen, đầu hồng, kính đen có logo vô cực, tai nghe, mũ nhiều màu + ăng-ten đỏ.
  // Cùng engine voxel (Soldier.VB = VB của game 2) nên chép nguyên các khối. Dựng 1 lần rồi clone (dùng chung geometry) cho nhẹ.
  // Logo vô cực trên kính bot: lưới lấy mẫu từ ảnh logo gốc (chép nguyên từ entities/bot-model.js của game gốc) -> đúng hình dạng, độ cong, sắc độ
const BLG_W=120,BLG_H=66,BLG_ASPECT=1.8207,BLG_B64='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
const BLG_PX=[
  '............................hjklmmmkj..............................................jkllmmnk.............................',
  '........................jkmqsuwyyyxwutspok....................................imortvxxyyzzxwvsqn........................',
  '.....................jlqvBGKMOPPPPPPOMKGBxson..............................kmpuAGKMPQQQQQQPOMKFBxup.....................',
  '...................jnvDJMMJHFDDCDDEFIJMOPOKEzto..........................kovCJOQONMMMMNNOOPQRRRQNJEyro..................',
  '.................jntCKKGBzxxxxyyyzzAABCEGKPQPGxtm......................intENQOKIIJKLMNNNOOPPQRSSTTQKFAs.................',
  '................kqAGGCywwwwxxxxyyyzzzzAABDGJMPMExrl...................lsBKOLIHIJKLLMMNNOOOPPQQRSTUUTRMFwo...............',
  '..............imuCBywvvvwwwxxxxyyyyzzzzzABCDFIMPLEwo................jozKMJGGHJKLLLMMMMNNOOPPPQQRRSUVXWSLDv..............',
  '.............kpwzwuvvvvwwwwxxxyyyyyzzzzzzAABCDGJNPKAuo............jmuGMIEFHIJKLLMMMMNNNNNOOPPQQRRRSTUWYWRJBq............',
  '...........hkrwwuuuvvvvvwwwxxyyzzzyyyyyyyyzAACDEHKOOJCvqok.....kmpwELKFFGIJKLMNNNNNMMMMMNNOOPPQQQRSTTUVYYWPFu...........',
  '...........kqvutuuuuvvvwwwxyzAAzzzyxxwwwwwwyzABCEGJNPPKCxvtrqrstzGNNIDEHIJLMNOOONMLJJJIJJKLNOOPPQQRSTUUVY+YQHr..........',
  '..........jottttuuuuvvwxxyABBBBBCDEFEDCBywvuvwyABDFIKMPPOLIHGHKMONJFDFHJKNPQQPNLKJJIHHGFEEFIJLNPQQRSTUUUVYZYQFq.........',
  '........ginrsttuuvvvvwxzBDEDEGKNPQQPPPPPNKFAwtuwyABDEGHJLMNONMLJGFEFHJKOQSRPNMNPQQQQQQQOLIECCDHLNPQRSTUUVVXZYRIu........',
  '........imqrsttuuvvwwyBFGGHLOPNJEByvuuwyCHMOLEwtuwzBCCEEFFFGFFFFFGHIJMQTTQOPQPMHDAyxzBDGKOOMICADHLPQRSUUVVVX+ZTKs.......',
  '.......hlpqsttuuvvwxzDIJJMPNIBtr..........puCKKBvtuyACDDEEFFFFGGHIJKNSTRPPPJBtr.........qtAHMNHAzDIOQRTUVVVWX++UG.......',
  '......gjnqrstuuvvwwzEJLMOPIzqk..............jqDLGyttwzBDDEEFFGGHHJMPSSQPPLym..............lpwFOIByBINQSUVVVWWY+ZQz......',
  '......hlprsstuuvvwzFKMNPMDv...................myIJBvuvyACDEEFGHIJLOQQPQNCs...................qALKCxBHNRTUVVWWXZ+XLs.....',
  '.....gjnqssstuvvwzHNOOPGyq......................ozJIEzwwyzBCEFGHJLMOPPFs......................mtDJCwzFNRTVWWWWX+/VF.....',
  '....ghlprsstuvvwzGPRPODu..........................qDLMJGDCBCDFHJMPRPJw..........................owGAwyGOSUVWWWXY++Qy....',
  '....hjnqssstuvvxEOTQPDu............................krBKONMLMNPRSSOHyo............................nvEyvAJRTVWWWXX+/WLr...',
  '...ghkorssstuvwAKTRPGw................................quBFIJKJHEzt................................nwBwvDNSTVWXXXY+ZSA...',
  '...gimpsssstuvyHTUPFy..............................................................................ntytxGPSUWXXXXZ+ZM...',
  '...hknrrssstvxEPWRGyq..............................................................................jmsvtAJRTVWXXXY++Tw..',
  '..gilprrsstuvALWWLAp................................................................................jmutvENSTVWXXY+/YG..',
  '..gjmqrrsstuwFSYSDw..................................................................................kputzJRTUWXXY+/+Pp.',
  '..gknqrrsstuyKWYNzr..................................................................................jltrvEPTUVWXYZ//Tw.',
  '..hlprrrsstvBRZWGw....................................................................................jptsAMSTUWXYY+/XA.',
  '.gilprrrstuwFW+TBs....................................................................................ilurwISTUVWXYZ/ZH.',
  '.gimqrrrstuxKYZOzp.....................................................................................jtrtFQTUVWXYZ/+O.',
  '.gjnqrrrstvyN+YKy......................................................................................jrtsCPSUVWXYZ//Qp',
  '.gjnqrrrttvAQ+XHw......................................................................................ipvsBOTTUVXXY+/St',
  '.gjoqrrstuvBS+VFu......................................................................................hnwrzMSTUVXYY+/Ux',
  'fgjoqrrstuvCU+UDs......................................................................................ilxryLSTUVXYY+/Vw',
  'ggjoqqrstuvDU+TCt......................................................................................ilxsxLSTUWXYY+/Wv',
  'fgjoqrrttuvCU+UDs......................................................................................ilxsxKSTUWXYY+/Wv',
  'ggjoqrsttuvCT+UDs......................................................................................hlxsxLSUVWXYY+/Vv',
  'hginqrsttuvBS+VEt......................................................................................hnxsyMSUVXYYY+/Vw',
  'hginqrsttuvzQ+XHw......................................................................................ipwsANTUWXYYY+/Tv',
  '.gimqrsstuvyO+ZKy......................................................................................irvtCOTVWXXYY++Qq',
  '.gimqrrstuvxLZ+Ozo.....................................................................................jutuEQTVWXYYZ/+Om',
  '.hhlprrstuuwGW+TBr....................................................................................hkvswHRUWXXYYZ/ZK.',
  '.hhkoqrsttuvCS+XFv....................................................................................hovtzKSVWXXYY+/XC.',
  '.hhjnqrrstuvzNYZNyq...................................................................................jttwDOUVWXXYY+/Ty.',
  '..hilprrsstuxHUZTBt..................................................................................hmwtyHRUVWXXYZ/+Pq.',
  '..hikorrrrtuvCOYWIxl.................................................................................jsvwBLSUVXXXY+/YJ..',
  '..gijmqrrrstvyGTYQBv................................................................................inxvAHPTUWXXXY++Uz..',
  '...iikprrrrsuvAKWWKyt..............................................................................ilxxyFNSTVWXXXZ+YNr..',
  '...hijnqrrrstuwCPXSIyr.................................lnortutrqo.................................imxzyCLQSUVWXXY+ZTD...',
  '...hijlprrrrstvxHTWQFwp.............................klqtyCFIJJIFAxrn.............................hlwAzBHPRSUVWXXZ+WMu...',
  '....ijknrrrrssuvAKUUNCvn..........................jnsyCHKNOPPQQQOLFztn..........................iltBBBFMRSTUVWXX+ZRE....',
  '.....jklprrrsstuwCMSTMCwq........................luCHKONMLKKLMOQRSQNIBs........................knvDDDELQRSTUWWXZ+UIq....',
  '.....ikknprrssstuwCJQRMExuo....................lsAEHIGEDDEEFGHJKNPSTSNGyq....................jlsAFGEFKQRSTTVWXY+XNv.....',
  '......kllnqssssstvxCIPRMHyurl................jnxEEFCAABCDEEFFGGHJLPSVVPJBvm.................lnuEHJGGLPRRSTUVWY+YRF......',
  '......immmorsssstuvxBINQNJDwtqn............lnuCFEDAyABCDDEEFFFFGGIKNRVWSMFzsq............klorAGLKHHMPRSSTUUVXZZULu......',
  '.......lnnmorsssstuvxAFKOPOJEzvtqpqonmnonquyDHHEAyyBBCCDDDDDDDEEFGHIKPUWWRMFByurronmmopoqtyCHLNKHJNPQRSTUUVWZYTNy.......',
  '........nponprsssttuvwyCFINQPNKGDBAyyyzBDGJLLHCyyzBCDEEDCCBBAAAzACEFHJMRUVUROLHEBAzzyzACFJMOPMJJLOQRRSTUUVWYYSOC........',
  '.........nrqoprssttuvvwxyAEHKNPQPONMMMNNONKHCzyzBBDEFEEFHJKLLJHEAyyzCFILNQSTUTSQPONNNNOPQQOMKKMOPQRSSTTUVWYWSPB.........',
  '..........pvroprstttuvwwxxyBCDFILMNONNMKGCAzzzABCDFGGGLQUUVVVVUTPHAwxAEHIKNPQRRSSSSSRQQONLLLMNPQRRSSTTTUWYWRRC..........',
  '...........rxtppqstttuvvwwxxyzABBCCCCCBAzzzzzABCEFGIMRTOFACyyCAGOSOHAwzDGHJLMNOPOPOOONMMMMNOPPQQRRSSTTUWWUSRE...........',
  '............rBztqqsttuvvvwwwwxxxyyyyyzzzzzzzABCEFHLSTJx..........vJSQGyxAEGIJKLMMMMNNNNNNOOPPPQQRRSSTUVURRSE............',
  '.............rDHAtqqsttuvvvvwwwwxxxxyyyyzzAABDEGJPTIv..............tGSNCyyBFHIJKLLMMMMMNNNOOPPQQQRSTUTRQSNy.............',
  '...............vJJAvrrstuuvvvwwwwxxxyyyyzAABCEJPTQy..................wNRLEzyBDGIJKLLLMMMNNOOPPQQRRRQPPSRD...............',
  '................oJQMEwsrsstuvvwwwwxxxxyyzABCGMTTHs....................pJTSLDzzADGHJKLLMMNNOOOPPPPNMNRUOu................',
  '..................zLQNGAwutttuuvvvwwxxyzBEJOSTKv........................wISRNIDBBCEFHIJKKLLLMLLLLNRTPD..................',
  '....................vFQSQMHECAzzzAABCFILQTUPFw............................vEOTSPMIGFEEEFGGHIKMPSUTHz....................',
  '.......................yAKQSSSRRRSSSTTSQKBu..................................tBJPTTTSRRRRSTTTRMDCq......................',
  '............................vxABAzzzyv............................................wzBDEEFCyxy...........................'
].join('');
function botLogoGrid(nx,ny){
  const out=new Array(nx*ny).fill(-1);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const ya=Math.floor(j*BLG_H/ny),yb=Math.max(Math.floor((j+1)*BLG_H/ny),ya+1),
          xa=Math.floor(i*BLG_W/nx),xb=Math.max(Math.floor((i+1)*BLG_W/nx),xa+1);
    let cnt=0,tot=0,sum=0;
    for(let r=ya;r<yb;r++)for(let c=xa;c<xb;c++){tot++;const ch=BLG_PX[r*BLG_W+c];if(ch!=='.'){cnt++;sum+=BLG_B64.indexOf(ch)}}
    if(cnt/tot>=.5)out[j*nx+i]=Math.round(sum/cnt/63*255);
  }
  return out;
}
  let botTpl=null;
  function buildBotTpl(){
    const VB=Soldier.VB,tri=(a,b,c)=>(i,j,k)=>[a,b,c][(i+j+k)%3];
    const g=new THREE.Group(),pivot=(n,x,y)=>{const q=new THREE.Group();q.name=n;q.position.set(x,y,0);g.add(q);return q},add=(par,vb)=>par.add(vb.mesh());
    const RED=tri(0x26262d,0x30303a,0x1d1d24),PINK=tri(0xff7a88,0xff95a0,0xf0606f),DRED=tri(0x15151a,0x1c1c22,0x101014),BLU=tri(0x2d3340,0x384050,0x252b36),ORG=tri(0x3a3a44,0x45454f,0x2f2f38);
    // thân
    const T=new VB();
    T.box(0,.95,0,.7,.7,.4,(i,j,k,nx,ny,nz)=>{
      if(j<2)return (i+k)&1?0xffd23f:0xffe680;
      if(k===nz-1){const d=Math.abs(i-(nx-1)/2)+Math.abs(j-8);if(d<=1)return 0xff4d5e;if(d<=3)return 0xffd23f}
      return RED(i,j,k)},.05,true);
    T.box(0,.66,.215,.14,.1,.03,0xffd23f,.02);T.box(0,.66,.235,.05,.05,.02,0x4d9dff,.015);
    T.box(-.2,.98,.212,.07,.6,.03,0x3a3850,.02);T.box(.2,.98,.212,.07,.6,.03,0x3a3850,.02);
    T.box(0,1.32,0,.3,.06,.28,0x3a3850,.03,true);
    T.box(0,1.0,-.28,.42,.44,.16,BLU,.045,true);T.box(0,1.15,-.29,.44,.1,.18,0x3a4256,.04,true);
    T.box(0,.88,-.375,.28,.16,.03,0xffd23f,.03,true);T.box(0,1.05,-.375,.06,.06,.02,0xff4d5e,.02);
    add(g,T);
    // đầu: kính đen + logo vô cực trắng, miệng có răng, má hồng, tai nghe, mũ, ăng-ten
    const H=new VB(),HY=1.6,VY=1.65,VF=.32;
    H.box(0,HY,0,.56,.56,.56,PINK,.05,true);
    H.box(0,VY,.27,.6,.28,.1,(i,j,k)=>(i+j+k)&1?0x14141b:0x1e1e27,.04,true);
    {const LW=.46,LS=.0139,nx=Math.round(LW/LS),ny=Math.round(nx/BLG_ASPECT),LH=LW/BLG_ASPECT,lg=botLogoGrid(nx,ny);
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
        const l=lg[j*nx+i];if(l<0)continue;
        const px=(-.5+(i+.5)/nx)*LW,py=VY+(.5-(j+.5)/ny)*LH;
        H.cube(px,py,VF+.01,LS*.95,LS*.95,.02,(l<<16)|(l<<8)|l,i,j,0)}}
    H.box(0,1.4,.292,.28,.06,.02,0x2b2a3a,.01);H.box(0,1.4,.305,.25,.035,.01,(i)=>i&1?0xffffff:-1,.02);
    for(const sx of[-.2,.2])H.box(sx,1.45,.286,.07,.04,.012,0xff9fbf,.02);
    for(const sx of[-1,1]){H.cyl(sx*.3,1.6,0,.08,.05,0xffd23f,.02,'x');H.cyl(sx*.325,1.6,0,.045,.02,0x3a3850,.015,'x')}
    H.box(0,1.91,0,.4,.06,.4,tri(0xffd23f,0x4d9dff,0x7fe0a0),.04,true);H.box(0,1.89,.26,.4,.03,.14,0xff9a3c,.03);
    H.cyl(.1,2.0,0,.012,.12,0x3a3850,.012,'y');H.ell(.1,2.09,0,.035,.035,.035,0xff2a4d,.015);
    add(g,H);
    const lL=pivot('lL',-.17,.6),lR=pivot('lR',.17,.6),aL=pivot('aL',-.46,1.27),aR=pivot('aR',.46,1.27);
    for(const l of[lL,lR]){
      const v=new VB();
      v.box(0,-.24,0,.3,.48,.32,DRED,.05,true);v.box(0,-.27,.175,.22,.14,.05,0xffd23f,.03);v.box(0,-.47,0,.32,.05,.34,0xffd23f,.025,true);
      v.box(0,-.54,.05,.32,.12,.44,(i,j)=>j===0?0x3a3850:((i+j)&1?0xf4f4f8:0xe4e4ee),.04,true);v.box(0,-.54,.24,.3,.11,.06,0x4d9dff,.03);
      add(l,v);
    }
    for(const a of[aL,aR]){
      const v=new VB();
      v.box(0,-.22,0,.22,.44,.26,RED,.05,true);v.box(0,-.47,0,.24,.06,.28,0xffd23f,.03,true);v.box(0,-.56,0,.2,.12,.24,ORG,.04,true);
      v.box(0,-.6,.1,.18,.03,.05,0x3a3850,.02);
      v.box(0,.02,0,.3,.1,.34,DRED,.05,true);v.box(0,.075,0,.3,.02,.34,0xffd23f,.02);
      add(a,v);
    }
    return g;
  }
  function prepBots(){try{if(!botTpl&&typeof Soldier!=='undefined')botTpl=buildBotTpl()}catch(e){console.warn('[visit] dựng bot lỗi',e)}}
  let hurtEl=null;
  function hurtFlash(){
    if(!hurtEl){hurtEl=document.createElement('div');hurtEl.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity .35s;box-shadow:inset 0 0 130px 40px rgba(255,20,20,.6)';document.body.appendChild(hurtEl)}
    hurtEl.style.transition='none';hurtEl.style.opacity='1';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{hurtEl.style.transition='opacity .45s';hurtEl.style.opacity='0'}));
  }
  // Tên "@TÊN" trên đầu bot (chép từ entities/botnames.js của game gốc): chữ nâu ánh kim, hiện khi cách camera <= 40m
  const NT={W:512,H:64,h:.42,y:2.27,range:40};
  function nameTag(b,name){
    const c=document.createElement('canvas');c.width=NT.W;c.height=NT.H;const g=c.getContext('2d'),W=NT.W,H=NT.H,txt='@'+name;
    g.font='700 34px "Segoe UI","Noto Sans",Arial,sans-serif';
    let w=g.measureText(txt).width;const k=w>W-44?(W-44)/w:1;
    g.save();g.translate(W/2,H/2+1);g.scale(k,1);g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=6;
    g.shadowColor='rgba(0,0,0,.65)';g.shadowBlur=5;g.shadowOffsetY=2;g.strokeStyle='rgba(48,26,12,.92)';g.strokeText(txt,0,0);
    g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
    const gr=g.createLinearGradient(0,-18,0,18);
    gr.addColorStop(0,'#fff3dc');gr.addColorStop(.3,'#e9bd8c');gr.addColorStop(.5,'#c08a58');gr.addColorStop(.52,'#8d5830');gr.addColorStop(.78,'#c99762');gr.addColorStop(1,'#f3d3a6');
    g.fillStyle=gr;g.fillText(txt,0,0);g.lineWidth=1;g.strokeStyle='rgba(255,236,200,.45)';g.strokeText(txt,0,0);g.restore();
    const tex=new THREE.CanvasTexture(c),spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
    spr.scale.set(NT.h*W/H,NT.h,1);spr.position.set(0,NT.y,0);spr.userData.vkfx=true;b.g.add(spr);b.tag=spr;b.tagTex=tex;
  }
  function spawnBot(x,z,hp,maxhp,nm){
    if(typeof Soldier==='undefined'||RBOT.list.length>=40)return null;
    prepBots();if(!botTpl)return null;
    const g=botTpl.clone(true);RBOT.n++;
    const m={g,legL:g.getObjectByName('lL'),legR:g.getObjectByName('lR'),armL:g.getObjectByName('aL'),armR:g.getObjectByName('aR')};
    const b={g,m,x,z,hp:hp||100,maxhp:maxhp||100,t:Math.random()*6,cd:.8+Math.random()*1.2,stuck:0,melee:0,id:RBOT.n};
    g.traverse(o=>{if(o.isMesh)o.userData.rbot=b});
    g.position.set(x,0,z);scene.add(g);RBOT.list.push(b);
    if(nm){b.nm=String(nm).slice(0,24);try{nameTag(b,b.nm)}catch(e){}}
    return b;
  }
  function removeBot(b){if(b.tagTex)b.tagTex.dispose();scene.remove(b.g);const i=RBOT.list.indexOf(b);if(i>=0)RBOT.list.splice(i,1)}
  function botDie(b){
    fxInit();
    for(let i=0;i<40;i++)spark(b.x+(Math.random()-.5)*.6,.3+Math.random()*1.5,b.z+(Math.random()-.5)*.6,(Math.random()-.5)*9,Math.random()*8,(Math.random()-.5)*9,.5+Math.random()*.6,.07+Math.random()*.1,i%3?0xb02030:0x3a3a48,20);
    sfx('click');removeBot(b);toast('💥 Hạ gục 1 bot');
  }
  function botHit(b,dmg){b.hp-=dmg;if(b.hp<=0)botDie(b)}
  function botShot(b,d){
    const eye=camera.position,sx=b.x+Math.sin(b.g.rotation.y)*.7,sz=b.z+Math.cos(b.g.rotation.y)*.7;
    const miss=Math.random()<.65;
    const to=V3(eye.x+(miss?(Math.random()-.5)*3:0),eye.y-(miss?Math.random()*1.2:.2),eye.z+(miss?(Math.random()-.5)*3:0));
    tracer(V3(sx,1.3,sz),to);sfx('pistol',.3/(1+d/14));
    if(!miss){hurtFlash();K.shake=Math.max(K.shake,.25)}
  }
  function botsTick(dt){
    const L=RBOT.list;if(!L.length)return;
    const px=player.x,pz=player.z;
    for(let i=L.length-1;i>=0;i--){
      const b=L[i],dx=px-b.x,dz=pz-b.z,d=Math.hypot(dx,dz)||1;let mv=0;
      if(d>1.7){
        const ux=dx/d,uz=dz/d,st=5.2*dt,nx=b.x+ux*st,nz=b.z+uz*st;let moved=false;
        if(!blocked(nx,b.z)){b.x=nx;moved=true}
        if(!blocked(b.x,nz)){b.z=nz;moved=true}
        if(!moved){b.stuck+=dt;if(b.stuck>.25){const s=(b.id%2)?1:-1,ax=b.x-uz*s*st*1.6,az=b.z+ux*s*st*1.6;if(!blocked(ax,az)){b.x=ax;b.z=az}}}else b.stuck=0;
        mv=1;
      }
      for(let j=0;j<L.length;j++){if(j===i)continue;const o=L[j],ox=b.x-o.x,oz=b.z-o.z,od=Math.hypot(ox,oz);if(od<.8&&od>1e-3){const k=(.8-od)*.5/od;if(!blocked(b.x+ox*k,b.z))b.x+=ox*k;if(!blocked(b.x,b.z+oz*k))b.z+=oz*k}}   // không chồng lên nhau
      b.t+=dt*10*mv;const sw=Math.sin(b.t)*.9*mv;
      if(b.m.legL)b.m.legL.rotation.x=sw;if(b.m.legR)b.m.legR.rotation.x=-sw;if(b.m.armL)b.m.armL.rotation.x=-sw*.8;if(b.m.armR)b.m.armR.rotation.x=sw*.8;
      b.g.position.set(b.x,Math.abs(Math.sin(b.t))*.06*mv,b.z);b.g.rotation.y=Math.atan2(dx,dz);
      if(b.tag){const cx=camera.position.x-b.x,cy=camera.position.y-1,cz=camera.position.z-b.z;b.tag.visible=cx*cx+cy*cy+cz*cz<NT.range*NT.range}
      b.cd-=dt;
      if(b.cd<=0&&d<24){b.cd=1.2+Math.random()*1.3;botShot(b,d)}
      if(d<=1.9){b.melee-=dt;if(b.melee<=0){b.melee=.7;hurtFlash();sfx('click')}}
    }
  }
  // lấy các bot còn sống trong bán kính R quanh (cx,cz) ra khỏi thế giới này (để theo người chơi về game kia)
  function takeBots(cx,cz,R,max){
    const c=RBOT.list.map(b=>({b,d:Math.hypot(b.x-cx,b.z-cz)})).filter(o=>o.d<=R).sort((a,b)=>a.d-b.d).slice(0,max),out=[];
    for(const o of c){out.push({hp:o.b.hp,maxhp:o.b.maxhp,nm:o.b.nm,dist:o.d});removeBot(o.b)}
    return out;
  }
  // ---- nhịp mỗi khung hình của phần bắn súng ----
  function fireTick(dt){
    fxInit();
    K.cd-=dt;K.gcd-=dt;
    if(K.kick>0)K.kick=Math.max(0,K.kick-dt*9);
    if(K.flashT>0)K.flashT-=dt;
    if(K.hold>=0)K.hold+=dt;
    if(K.throwT>0){K.throwT-=dt;if(K.throwT<=0){K.throwT=0;launch(K.throwP)}}
    const F=FIRE[K.cur];
    if(K.fireHeld&&F&&F.auto&&K.cd<=0)shoot();                  // súng dài bắn liên thanh khi giữ chuột
    if(K.shake>0){K.shake=Math.max(0,K.shake-dt*1.8);camera.position.x+=(Math.random()-.5)*K.shake*.35;camera.position.y+=(Math.random()-.5)*K.shake*.35;camera.position.z+=(Math.random()-.5)*K.shake*.35}
    grenTick(dt);fxUpdate(dt);botsTick(dt);
  }
  function flashMesh(fp){
    const f=new THREE.Mesh(new THREE.BoxGeometry(.13,.13,.06),new THREE.MeshBasicMaterial({color:0xffc84a,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:!fp,fog:false,toneMapped:false}));
    f.visible=false;f.frustumCulled=false;f.renderOrder=1002;f.userData.vkfx=true;return f;
  }
  // ---- nhảy / lướt / đổi súng / nạp đạn ----
  function select(i){
    const t=ORDER[i];if(!t||t===K.cur)return;
    K.cur=t;K.drawT=.35;K.relT=0;K.hold=-1;K.throwT=0;hud();
  }
  function selectName(n){const i=ORDER.indexOf(n);if(i>=0)select(i)}
  function trySlide(){
    if(K.jy>0||K.slideCd>0||typeof keys==='undefined')return;
    let f=0,s=0;
    if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyA||keys.ArrowLeft)s-=1;if(keys.KeyD||keys.ArrowRight)s+=1;
    const mg=Math.hypot(f,s);if(!mg)return;f/=mg;s/=mg;
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);
    K.sd.x=-sy*f+cy*s;K.sd.z=-cy*f-sy*s;K.slideT=.7;K.slideCd=1.1;
  }
  // ---- LỘN NHÀO (Shift) góc nhìn thứ 3: chép từ player/thirdperson.js (rollPose / rollLift / slideDust) của game gốc ----
  // chồm tới -> chúi đầu, co người thành khối tròn, lộn trọn 360° về phía trước theo HƯỚNG LĂN -> bật dậy. Hai tay ôm gối, chân gập, súng ra sau lưng, bụi bay.
  const _sq=new THREE.Quaternion(),_se=new THREE.Euler(),_bp=V3(0,0,0);
  let dustT=0;
  function rollTP(dt){
    const m=K.model;if(!m||!avatar)return;
    const w=Math.min(1,K.slK*1.6),rolling=K.slideT>0;
    if(K.slK<.02&&!rolling){m.g.rotation.set(0,0,0);m.g.position.set(0,0,0);m.g.scale.y=1;return}
    const ru=rolling?1-K.slideT/.7:1,tk=e3(cl3(ru,.08,.3))*(1-e3(cl3(ru,.85,1)));
    const lean=rolling?2*Math.PI*e3(cl3(ru,.08,.92))+.45*Math.sin(Math.PI*cl3(ru,0,.2)):0;
    // thân quay theo hướng lăn (không phải hướng nhìn)
    const hd0=player.yaw+Math.PI;let dh=Math.atan2(K.sd.x,K.sd.z)-hd0;dh-=Math.round(dh/(2*Math.PI))*2*Math.PI;
    avatar.rotation.y=hd0+dh*K.slK;
    m.g.rotation.set(lean,0,0);
    m.g.position.set(0,.75-.75*Math.cos(lean),-.75*Math.sin(lean));   // giữ nguyên chỗ hông khi nghiêng
    m.g.scale.y=1-.22*tk*K.slK;
    // chân gập lên ngực, tay ôm gối
    const tg=-1.55*tk;m.legL.rotation.x+=(tg-m.legL.rotation.x)*w;m.legR.rotation.x+=(tg-m.legR.rotation.x)*w;
    const ax=-1.3-1.5*(1-tk);
    _sq.setFromEuler(_se.set(ax,0,-.12));m.armL.quaternion.slerp(_sq,w);m.armL.scale.y+=(1-m.armL.scale.y)*w;
    _sq.setFromEuler(_se.set(ax,0,.12));m.armR.quaternion.slerp(_sq,w);m.armR.scale.y+=(1-m.armR.scale.y)*w;
    ORDER.forEach(u=>{held[u].visible=false;slung[u].visible=(u!=='grenade')});   // hai tay bận: súng đeo ra sau lưng
    // lăn trên đất: điểm thấp nhất của thân luôn sát mặt đất
    m.g.updateMatrixWorld(true);
    const a=m.legL.rotation.x,fy=.75-.75*Math.cos(a),fz=-.75*Math.sin(a);let mn=1e9;
    for(const[x,y,z]of[[0,1.7,.1],[0,.75,-.25],[0,1.3,-.25],[.14,fy,fz],[-.14,fy,fz]]){_bp.set(x,y,z).applyMatrix4(m.g.matrixWorld);if(_bp.y<mn)mn=_bp.y}
    m.g.position.y+=((avatar.position.y-K.jy)+.04-mn)*w/avatar.scale.y;
    // bụi lúc bật đi và lúc tiếp đất
    if(rolling&&(ru<.12||ru>.6)){dustT-=dt;if(dustT<=0){dustT=.035;fxInit();
      for(let i=0;i<2;i++)spark(player.x-K.sd.x*(.1+Math.random()*.5)+(Math.random()-.5)*.4,avatar.position.y-K.jy+.06,player.z-K.sd.z*(.1+Math.random()*.5)+(Math.random()-.5)*.4,(Math.random()-.5)*.6,.3+Math.random()*.4,(Math.random()-.5)*.6,.45,.12+Math.random()*.1,0xd8cdb4,-.4)}}
  }
  let tickBusy=false;
  function tick(){
    if(tickBusy)return;tickBusy=true;
    try{
      const now=performance.now(),dt=Math.min(.05,Math.max(0,(now-K.t0)/1000));K.t0=now;
      const busy=(typeof panelOpen!=='undefined'&&panelOpen)||(typeof DLG!=='undefined'&&DLG)||(typeof photoMode!=='undefined'&&photoMode);
      if(K.drawT>0)K.drawT=Math.max(0,K.drawT-dt);
      if(K.relT>0){K.relT=Math.max(0,K.relT-dt);if(K.relT===0){if(FIRE[K.relFor])K.ammo[K.relFor]=FIRE[K.relFor].mag;hud()}}
      fireTick(dt);
      if(K.toastT>0){K.toastT-=dt;if(K.toastT<=0&&toastEl)toastEl.style.opacity='0'}
      K.slideCd-=dt;
      K.aim+=((K.aimOn&&!busy?1:0)-K.aim)*Math.min(1,dt*12);
      // nhảy: cùng số với game 2 (vận tốc 8, trọng lực 22)
      if(typeof keys!=='undefined'&&keys.Space&&K.jy<=0&&K.slideT<=0&&!busy&&typeof obDone!=='undefined'&&obDone){K.vy=8;K.jy=1e-4}
      if(K.jy>0){K.vy-=22*dt;K.jy+=K.vy*dt;if(K.jy<=0){K.jy=0;K.vy=0}}
      // lướt: đẩy người chơi theo hướng đang đi, tránh vật cản bằng blocked() của game 1
      if(K.slideT>0){
        K.slideT-=dt;const sp=3+9*Math.max(0,K.slideT/.7);
        const nx=player.x+K.sd.x*sp*dt,nz=player.z+K.sd.z*sp*dt;
        if(!blocked(nx,player.z))player.x=nx;if(!blocked(player.x,nz))player.z=nz;
      }
      const sk=K.slideT>0?Math.min(1,K.slideT/.2,(.7-K.slideT)/.1+.0001):0;
      const tp=!!(avatar&&avatar.visible);
      const moving=typeof keys!=='undefined'&&(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight);
      camera.position.y+=K.jy-(tp?0:.6*sk);
      K.slK+=((K.slideT>0?1:0)-K.slK)*Math.min(1,dt*18);
      if(tp){avatar.position.y+=K.jy;tpUpdate(dt);rollTP(dt)}
      else if(K.model){K.model.g.rotation.set(0,0,0);K.model.g.position.set(0,0,0);K.model.g.scale.y=1}
      const scoped=K.aim>.6&&K.cur==='sniper'&&!tp;
      if(vm)fpUpdate(dt,!!moving&&K.jy<=0,!tp&&!busy&&!scoped);
      if(scopeEl)scopeEl.style.display=scoped?'block':'none';
      const want=(K.aim>.05&&!busy)?66+(ZOOM[K.cur]-66)*K.aim:66;
      if(!busy&&Math.abs(camera.fov-want)>.01){camera.fov=want;camera.updateProjectionMatrix()}
    }catch(e){if(!window.__vkErr){window.__vkErr=1;console.warn('[visit-kit]',e)}}
    tickBusy=false;
  }
  function hook(){
    if(K.hooked||typeof renderer==='undefined'||!renderer)return;
    K.hooked=true;const orig=renderer.render.bind(renderer);
    const inv=new THREE.Matrix4();
    renderer.render=function(s,c){
      tick();const r=orig(s,c);
      if(vm&&vm.visible&&!window.__visitPaused&&c===camera){   // lượt 2: chỉ vẽ tay + súng (layer 1) sau khi xoá depth
        const bg=s.background,ac=renderer.autoClear,fg=s.fog;
        try{
          camera.updateMatrixWorld();inv.copy(camera.matrixWorld).invert();
          vmMat.uniforms.uUp.value.set(0,1,0).transformDirection(inv);vmMat.uniforms.uSun.value.set(5,10,3).normalize().transformDirection(inv);
          s.background=null;s.fog=null;renderer.autoClear=false;renderer.clearDepth();camera.layers.set(1);
          orig(s,c);
        }catch(e){if(!window.__vkErr2){window.__vkErr2=1;console.warn('[visit-kit] lượt vẽ súng lỗi',e)}}
        finally{camera.layers.set(0);s.background=bg;s.fog=fg;renderer.autoClear=ac}
      }
      return r;
    };
  }
  // ---- phím / chuột ----
  addEventListener('keydown',e=>{
    const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA')return;
    if(/^Digit[0-9]$/.test(e.code)){const n=+e.code[5];if(n>=1&&n<=4)select(n-1);e.stopImmediatePropagation();e.preventDefault()}
    else if(e.code==='KeyR'){reload();e.stopImmediatePropagation();e.preventDefault()}
    else if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat)trySlide();
    else if(e.code==='Space')e.preventDefault();   // không cuộn trang; game 1 vẫn nhận phím để bước đi bình thường
  },true);
  addEventListener('mousedown',e=>{
    if(e.button===2){K.aimOn=true;e.preventDefault();return}
    if(window.__visitPaused)return;   // đang ở game cha (Block Arena): không nhận chuột / bắn
    if(e.button===0&&typeof locked!=='undefined'&&locked){
      e.stopImmediatePropagation();
      try{if(typeof sfxWake==='function')sfxWake()}catch(err){}   // mở khoá âm thanh (cần thao tác người dùng)
      K.fireHeld=true;
      if(K.cur==='grenade')gPin();else shoot();
    }
  },true);
  addEventListener('mouseup',e=>{
    if(e.button===2)K.aimOn=false;
    if(e.button===0){K.fireHeld=false;if(K.cur==='grenade')gRelease()}
  },true);
  addEventListener('contextmenu',e=>e.preventDefault(),true);
  addEventListener('blur',()=>{K.aimOn=false;K.fireHeld=false;K.hold=-1});
  addEventListener('mousemove',e=>{K.mx+=e.movementX||0;K.my+=e.movementY||0},true);
  return {attach:attach,state:K,select:select,selectName:selectName,reload:reload,tick:tick,shoot:shoot,gPin:gPin,gRelease:gRelease,spawnBot:spawnBot,takeBots:takeBots,prepBots:prepBots,bots:RBOT.list};
})();
