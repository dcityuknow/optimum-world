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
    '#menuBtn,#viewBtn,#jrnBtn,#runBtn,#hitBtn,#photoBtn,#hotbar,#prog,#prompt,#act,#qi,#qt,#qtoast,'+
    '#dlg,#panel,#menu,#done,#wardP,#jrnP,#rideHUD,#rideRes,#lbP,#codeP,#fish,#shot,#photoBar,#vf,#mapView'+
    '{display:none!important}'+
    '#visitTag{position:fixed;left:12px;top:12px;z-index:99998;padding:6px 12px;border-radius:999px;background:rgba(20,20,30,.65);color:#fff;font:600 14px system-ui,sans-serif;pointer-events:none}';
  document.head.appendChild(st);

  // 2) Chặn phím tương tác. Giữ WASD / chuột / Shift để đi lại.
  //    E đọc-nói chuyện · J nhiệm vụ · R chụp ảnh · F,Q,Enter hành động · số 1-9 túi đồ
  const BLOCK=/^(KeyE|KeyJ|KeyR|KeyF|KeyQ|Enter|NumpadEnter|Digit[0-9]|Numpad[0-9]|Tab)$/;
  const stop=e=>{if(BLOCK.test(e.code)){e.preventDefault();e.stopImmediatePropagation()}};
  addEventListener('keydown',stop,true);addEventListener('keyup',stop,true);

  // 3) Tự vào thẳng thành phố: ẩn màn chào, rồi bấm "Continue" qua từng bước tới "Enter the world".
  //    Nếu sau ~8 giây vẫn chưa vào được thì hiện lại màn chào để người chơi tự bấm (không bị kẹt màn đen).
  const hideStart=document.createElement('style');
  hideStart.textContent='#start{opacity:0!important;pointer-events:none!important}';
  document.head.appendChild(hideStart);
  const vis=id=>{const b=document.getElementById(id);return b&&b.offsetParent!==null&&!b.disabled?b:null};
  let n=0;
  const auto=setInterval(()=>{
    const s=document.getElementById('start');
    if(s&&getComputedStyle(s).display==='none'){clearInterval(auto);hideStart.remove();return}
    if(++n>24){clearInterval(auto);hideStart.remove();return}   // 24 x 350ms ~ 8s
    const t=vis('enterBig')||vis('enter')||vis('obSkip');
    if(t)t.click();
  },350);

  // 4) Huy hiệu
  addEventListener('load',()=>{
    const d=document.createElement('div');d.id='visitTag';d.textContent='🌐 Chế độ tham quan';document.body.appendChild(d);
  });
})();
