// ============================================================================
// VISIT-KIT: mang bộ đồ nghề của game 2 (from0tohero) sang thế giới optimum-world - CHỈ ĐỂ XEM, KHÔNG BẮN, KHÔNG TƯƠNG TÁC.
// Có: nhảy (Space) · lướt (Shift) · đổi súng 1-4 (súng ngắn / súng dài / súng ngắm / lựu đạn) · nạp đạn (R) · ngắm (chuột phải, súng ngắm có kính)
//     · góc nhìn thứ nhất: tay + súng trước mặt · góc nhìn thứ 3 (C): súng trong tay, súng còn lại đeo sau lưng / hông như game 2.
// Bị khoá: bắn (chuột trái), ném lựu đạn - bấm sẽ hiện thông báo. Chỉ nạp khi ?visit=1, sau soldier.js (xem visit-mode.js).
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
  const MAG={pistol:12,rifle:30,sniper:5,grenade:3},RES={pistol:36,rifle:90,sniper:10,grenade:0};   // số liệu từ config.js game 2 (chỉ hiển thị, không bắn nên không trừ)
  const ZOOM={pistol:58,rifle:50,sniper:18,grenade:66};
  const G0={pistol:[.2,-.2,-.5],rifle:[.22,-.24,-.58],sniper:[.22,-.26,-.64],grenade:[.2,-.2,-.46]};   // chỗ tay phải nắm súng (toạ độ camera, góc nhìn thứ nhất)
  const TPH={pistol:[.3,1.32,.62],rifle:[.28,1.2,.5],sniper:[.28,1.2,.5],grenade:[.28,1.12,.42]};      // chỗ tay phải nắm súng (toạ độ thân nhân vật, góc nhìn thứ 3)
  const SH_R=V3(.336,1.344,0),SH_L=V3(-.336,1.344,0),DOWN=V3(0,-1,0),ZAX=V3(0,0,1);
  const _a=V3(0,0,0),_b=V3(0,0,0),_c=V3(0,0,0);
  const K={cur:'pistol',drawT:.35,relT:0,aim:0,aimOn:false,jy:0,vy:0,slideT:0,slideCd:0,sd:{x:0,z:0},t0:performance.now(),bob:0,mx:0,my:0,sx:0,sy:0,toastT:0,model:null,charKey:'vn',hooked:false};
  let held={},slung={},vm=null,fpMat=null,fpGun={},armR=null,armL=null,hudEl=null,hudSlots=[],hudAmmo=null,toastEl=null,scopeEl=null;

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
    hudAmmo.textContent=K.relT>0?'⟳ Đang nạp đạn…':(t==='grenade'?'💣 ×'+MAG.grenade:MAG[t]+' / '+RES[t]);
  }
  function toast(msg){
    if(!toastEl)return;toastEl.textContent=msg;toastEl.style.opacity='1';K.toastT=1.6;
  }
  // ---- góc nhìn thứ nhất: tay + súng gắn vào camera, vẽ đè lên cảnh ----
  function armMesh(fp){
    const v=new VB();
    v.box(0,0,0,.085,.085,1,(i,j,k,nx,ny,nz)=>{
      if(k/nz>=.8)return fp.glove||((i+j+k)&1?fp.skin[0]:fp.skin[1]);
      return fp.sleeve(i,j,k);
    },.03,false);
    const m=v.mesh();m.material=fpMat;m.renderOrder=1000;m.frustumCulled=false;return m;
  }
  function buildVM(key){
    fpMat=new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x1e1e1e,fog:false,depthTest:false,depthWrite:false});
    vm=new THREE.Group();vm.visible=false;camera.add(vm);
    ORDER.forEach(t=>{const g=new THREE.Group();g.rotation.y=Math.PI;g.add(gunMesh(t,fpMat));g.visible=false;vm.add(g);fpGun[t]=g});
    const fp=Soldier.fp(key);armR=armMesh(fp);armL=armMesh(fp);vm.add(armR,armL);
  }
  const _mid=V3(0,0,0),_wt=V3(0,0,0),_d=V3(0,0,0);
  function limb(m,from,to){   // kéo dài cánh tay từ vai tới bàn tay (cả hai toạ độ theo vm)
    _mid.copy(to).add(from).multiplyScalar(.5);m.position.copy(_mid);
    _wt.copy(to).applyMatrix4(vm.matrixWorld);m.lookAt(_wt);
    m.scale.set(1,1,Math.max(.05,from.distanceTo(to)));
  }
  function fpUpdate(dt,moving,visible){
    vm.visible=visible;
    if(!visible)return;
    const t=K.cur,g=fpGun[t];
    ORDER.forEach(u=>fpGun[u].visible=(u===t));
    K.bob+=dt*(moving?9:2);
    const bobY=moving?Math.sin(K.bob)*.012:Math.sin(K.bob)*.003,bobX=moving?Math.cos(K.bob*.5)*.008:0;
    K.sx+=(Math.max(-1,Math.min(1,K.mx*.02))-K.sx)*Math.min(1,dt*8);K.sy+=(Math.max(-1,Math.min(1,K.my*.02))-K.sy)*Math.min(1,dt*8);K.mx=K.my=0;
    const draw=K.drawT>0?K.drawT/.35:0;
    vm.position.set(bobX-K.sx*.03,bobY-draw*.45+K.sy*.02,0);
    vm.rotation.set(K.sy*.04,K.sx*.05,0);
    const p=G0[t],a=K.aim;
    g.position.set(p[0]*(1-a*.88),p[1]*(1-a*.45),p[2]);
    let tilt=0;if(K.relT>0){tilt=Math.sin((1-K.relT/1.5)*Math.PI);g.position.y-=tilt*.1}
    g.rotation.set(tilt*.5,Math.PI,-tilt*.6);
    vm.updateMatrix();vm.updateMatrixWorld(true);g.updateMatrix();
    limb(armR,_c.set(.55,-.62,.12),_d.copy(g.position));armR.visible=true;
    const fg=GUN[t].fg;
    if(fg){_b.set(fg[0],fg[1],fg[2]).applyMatrix4(g.matrix);limb(armL,_c.set(-.55,-.62,.12),_b);armL.visible=true}
    else armL.visible=false;
  }
  // ---- góc nhìn thứ 3: súng trong tay + súng đeo ----
  function attach(m,key){
    ui();K.model=m;K.charKey=key||K.charKey;held={};slung={};
    ORDER.forEach(t=>{const g=new THREE.Group();g.add(gunMesh(t));g.visible=false;m.g.add(g);held[t]=g});
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
    let tilt=0;if(K.relT>0)tilt=Math.sin((1-K.relT/1.5)*Math.PI);
    const pit=(typeof player!=='undefined'&&player)?player.pitch:0;
    h.rotation.set(-pit*.7+tilt*.4,0,-tilt*.5);h.updateMatrix();
    aimArm(m.armR,SH_R,h.position);
    const fg=GUN[t].fg;
    if(fg){_b.set(fg[0],fg[1],fg[2]).applyMatrix4(h.matrix);if(K.relT>0)_b.y-=tilt*.18;aimArm(m.armL,SH_L,_b)}
  }
  // ---- nhảy / lướt / đổi súng / nạp đạn ----
  function select(i){
    const t=ORDER[i];if(!t||t===K.cur)return;
    K.cur=t;K.drawT=.35;K.relT=0;hud();
  }
  function reload(){if(K.cur==='grenade'||K.relT>0)return;K.relT=1.5;hud()}
  function trySlide(){
    if(K.jy>0||K.slideCd>0||typeof keys==='undefined')return;
    let f=0,s=0;
    if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyA||keys.ArrowLeft)s-=1;if(keys.KeyD||keys.ArrowRight)s+=1;
    const mg=Math.hypot(f,s);if(!mg)return;f/=mg;s/=mg;
    const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);
    K.sd.x=-sy*f+cy*s;K.sd.z=-cy*f-sy*s;K.slideT=.7;K.slideCd=1.1;
  }
  let tickBusy=false;
  function tick(){
    if(tickBusy)return;tickBusy=true;
    try{
      const now=performance.now(),dt=Math.min(.05,Math.max(0,(now-K.t0)/1000));K.t0=now;
      const busy=(typeof panelOpen!=='undefined'&&panelOpen)||(typeof DLG!=='undefined'&&DLG)||(typeof photoMode!=='undefined'&&photoMode);
      if(K.drawT>0)K.drawT=Math.max(0,K.drawT-dt);
      if(K.relT>0){K.relT=Math.max(0,K.relT-dt);if(K.relT===0)hud()}
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
      if(tp){avatar.position.y+=K.jy-.35*sk;if(K.model)K.model.g.rotation.x=-.9*sk;tpUpdate(dt)}
      else if(K.model)K.model.g.rotation.x=0;
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
    renderer.render=function(s,c){tick();return orig(s,c)};
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
    if(e.button===0&&typeof locked!=='undefined'&&locked){
      e.stopImmediatePropagation();
      toast(K.cur==='grenade'?'🚫 Chỉ tham quan - không ném được':'🚫 Chỉ tham quan - không bắn được');
    }
  },true);
  addEventListener('mouseup',e=>{if(e.button===2)K.aimOn=false},true);
  addEventListener('contextmenu',e=>e.preventDefault(),true);
  addEventListener('blur',()=>{K.aimOn=false});
  addEventListener('mousemove',e=>{K.mx+=e.movementX||0;K.my+=e.movementY||0},true);
  return {attach:attach,state:K,select:select,reload:reload,tick:tick};
})();
