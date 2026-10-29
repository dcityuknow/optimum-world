// ============================================================================
// CHẾ ĐỘ THAM QUAN: chỉ bật khi URL có ?visit=1 (game from0tohero mở game này qua lỗ hổng không gian).
// Chỉ đi dạo xem thành phố: không đọc / nói chuyện, không nhiệm vụ, không chụp ảnh, không menu.
// Đặt ở js/visit-mode.js, nạp CUỐI CÙNG trong index.html (sau js/main.js).
// ============================================================================
(function(){
  if(!/[?&]visit=1(&|$)/.test(location.search))return;

  // 1) Ẩn mọi giao diện tương tác (id lấy từ index.html). Giữ lại: canvas, minimap, tên khu vực, la bàn, cần điều khiển cảm ứng, nút âm thanh / ngôn ngữ.
  const st=document.createElement('style');
  st.textContent=
    '#menuBtn,#jrnBtn,#runBtn,#hitBtn,#photoBtn,#hotbar,#prog,#prompt,#act,#qi,#qt,#qtoast,'+
    '#dlg,#panel,#menu,#done,#wardP,#jrnP,#rideHUD,#rideRes,#lbP,#codeP,#fish,#shot,#photoBar,#vf,#mapView'+
    '{display:none!important}'+
    '#visitTag{max-width:calc(100vw - 24px);line-height:1.35;position:fixed;left:12px;top:12px;z-index:99998;padding:6px 12px;border-radius:999px;background:rgba(20,20,30,.65);color:#fff;font:600 14px system-ui,sans-serif;pointer-events:none}';
  document.head.appendChild(st);

  // 2) Chặn phím tương tác. Giữ WASD / chuột / Shift để đi lại.
  //    E đọc-nói chuyện · J nhiệm vụ · F,Q,Enter hành động. (R chụp ảnh của game 1 bị thay bằng R nạp đạn)
  const BLOCK=/^(KeyE|KeyJ|KeyF|KeyQ|Enter|NumpadEnter|Tab)$/;   // R (nạp đạn) và phím số (đổi súng) do visit-kit.js xử lý
  const stop=e=>{if(BLOCK.test(e.code)){e.preventDefault();e.stopImmediatePropagation()}};
  addEventListener('keydown',stop,true);addEventListener('keyup',stop,true);

  // 3) Tự vào thẳng thành phố: ẩn màn chào, bấm "Continue" qua từng bước tới "Enter the world".
  //    Bước 4 (tạo hồ sơ) bắt buộc điền đủ ô -> tự điền thông tin khách "Visitor" + ảnh đại diện vẽ sẵn.
  //    Nếu sau ~20 giây vẫn chưa vào được thì hiện lại màn chào để người chơi tự bấm (không bị kẹt màn đen).
  const hideStart=document.createElement('style');
  hideStart.textContent='#start{opacity:0!important;pointer-events:none!important}';
  document.head.appendChild(hideStart);
  const vis=id=>{const b=document.getElementById(id);return b&&b.offsetParent!==null&&!b.disabled?b:null};
  const setVal=(id,v)=>{const el=vis(id);if(el&&!el.value){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}};
  let avatarState=0;   // 0 chưa làm, 1 đang tạo, 2 xong
  function makeAvatar(){
    const inp=document.getElementById('avatarFile');
    if(!inp||avatarState)return;avatarState=1;
    const c=document.createElement('canvas');c.width=c.height=128;
    const g=c.getContext('2d');
    g.fillStyle='#7c4dff';g.fillRect(0,0,128,128);
    g.fillStyle='#fff';g.font='bold 72px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('V',64,70);
    c.toBlob(b=>{
      try{
        const dt=new DataTransfer();dt.items.add(new File([b],'visitor.png',{type:'image/png'}));
        inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(e){}
      avatarState=2;
    },'image/png');
  }
  let n=0;
  const auto=setInterval(()=>{
    const s=document.getElementById('start');
    if(s&&getComputedStyle(s).display==='none'){clearInterval(auto);hideStart.remove();return}
    if(++n>57){clearInterval(auto);hideStart.remove();return}   // 57 x 350ms ~ 20s
    if(vis('nickInput')){                                        // đang ở bước tạo hồ sơ
      setVal('nickInput','Visitor');setVal('bioInput','Just visiting');setVal('xInput','@visitor');
      makeAvatar();
      if(avatarState<2)return;                                   // chờ ảnh đại diện xong rồi mới bấm tiếp
    }
    const t=vis('enterBig')||vis('enter')||vis('obSkip');
    if(t)t.click();
  },350);

  // 4) Huy hiệu
  addEventListener('load',()=>{
    const d=document.createElement('div');d.id='visitTag';d.textContent='🌐 Tham quan · Chuột trái: bắn / ném (lựu đạn: giữ rồi thả) · Chuột phải: ngắm · 1-4: súng · R: nạp · C: góc nhìn · Space: nhảy · Shift: lướt';document.body.appendChild(d);
  });

  // 5) Góc nhìn thứ 3 bằng phím C (game 1 vốn đã có: lăn chuột đổi khoảng cách camera, camBack > 0.6 là hiện nhân vật)
  addEventListener('keydown',e=>{
    if(e.code!=='KeyC'||e.repeat)return;
    const t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA')return;
    camBack=camBack>0.6?0:3.2;
  },true);

  // 6) Nhân vật lính voxel của game 2 (from0tohero) thay cho người chơi mặc định.
  //    Mã nhân vật lấy từ ?char=xx (game 2 tự gắn khi mở lỗ hổng). Mã lạ / thiếu -> lính Việt Nam (vn).
  const CHAR=((new URLSearchParams(location.search).get('char')||'vn').replace(/[^a-z]/g,'').slice(0,4))||'vn';
  function installSoldier(){
    buildAvatar=function(){                      // ghi đè hàm dựng avatar của profile.js (cùng giao diện: avatar + aParts)
      if(avatar)scene.remove(avatar);
      const g=new THREE.Group();g.scale.setScalar(0.9);g.visible=false;scene.add(g);   // 0.9: lính cao ~2.0m cho vừa với thành phố
      const m=Soldier.make(CHAR);g.add(m.g);
      if(window.VisitKit)VisitKit.attach(m,CHAR);   // súng cầm / đeo, tay, tầm nhìn thứ nhất (visit-kit.js)
      m.g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
      const spr=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,opacity:0}));spr.visible=false;g.add(spr);   // loop.js vẫn chỉnh bảng tên: để một sprite ẩn cho nó chỉnh
      avatar=g;aParts={armL:m.armL,armR:m.armR,legL:m.legL,legR:m.legR,spr:spr};
    };
    if(typeof applyWear==='function')applyWear=function(){};   // đồ đội / đeo của người chơi cũ không áp dụng cho lính
    buildAvatar();
  }
  const load=(src,cb)=>{const e=document.createElement('script');e.src=src;e.onload=cb;e.onerror=()=>console.warn('[visit] không tải được '+src);document.body.appendChild(e)};
  load('js/soldier.js',()=>load('js/visit-kit.js',()=>{
    const t0=Date.now(),id=setInterval(()=>{
      if(typeof scene!=='undefined'&&scene&&typeof renderer!=='undefined'&&renderer&&typeof camera!=='undefined'&&camera&&typeof buildAvatar==='function'&&typeof avatar!=='undefined'&&avatar&&window.Soldier&&window.VisitKit){
        clearInterval(id);try{installSoldier()}catch(e){console.warn('[visit] không dựng được lính:',e)}
      }else if(Date.now()-t0>40000)clearInterval(id);   // chờ tối đa 40s cho thành phố dựng xong
    },300);
  }));
  load('js/visit-portal.js');   // màu rực rỡ + cổng trở về Block Arena (js/visit-portal.js)
})();
