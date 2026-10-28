/* ------------------------------ ONBOARDING ------------------------------ */
let obStep=1, obDone=false, obT=0;
const OB_CAM=[
  {a:[  10,  46, 120],b:[ -18,  30,  10],la:[0,6,-30],lb:[0,7,-6]},
  {a:[ -34,  26, -34],b:[ -26,  13,-108],la:[-30,7,-70],lb:[-30,5,-140]},
  {a:[  46,  22,  38],b:[  40,  11, -34],la:[70,6,-10],lb:[104,5,-20]},
  {a:[-100,  20,  40],b:[-150,  12,  22],la:[-118,6,-6],lb:[-176,5,-8]},
  {a:[   0,   9,  30],b:[   0,   9,  30],la:[0,7,0],lb:[0,7,0]}
];
function lerp(a,b,k){ return a+(b-a)*k; }
function easeIO(k){ return k<0.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2; }
function obCamera(dt){
  obT+=dt;
  const c=OB_CAM[Math.min(obStep,5)-1];
  if(obStep===5){
    const r=64, ang=obT*0.09;
    camera.position.set(Math.sin(ang)*r, 30+Math.sin(obT*0.25)*2.0, Math.cos(ang)*r);
    camera.lookAt(0,2,0);
    return;
  }
  const k=easeIO(Math.min(1,obT/17));
  camera.position.set(lerp(c.a[0],c.b[0],k), lerp(c.a[1],c.b[1],k), lerp(c.a[2],c.b[2],k));
  camera.lookAt(lerp(c.la[0],c.lb[0],k), lerp(c.la[1],c.lb[1],k), lerp(c.la[2],c.lb[2],k));
}
function obShow(n){
  obStep=n; obT=0;
  for(let i=1;i<=5;i++){
    const el=$('ob'+i); if(el) el.className = i===n ? 'ob on' : 'ob';
  }
  const dots=$('obDots').children;
  for(let i=0;i<dots.length;i++) dots[i].className = i===n-1 ? 'on' : '';
  $('obWrap').className = 'p'+n;
  $('start').className = n===5 ? 'final' : '';
  /* the first time in, the card has to be filled, so there is nothing to skip */
  $('obSkip').style.display = (n===5 || !profileComplete()) ? 'none' : 'block';
  $('obBack').style.display = (n===1||startMode==='edit') ? 'none' : 'block';
  $('enter').style.display = n===5 ? 'none' : 'block';
  $('enter').textContent = tr('next');
}
function obFinish(){
  obDone=true;
  profile.nick=($('nickInput').value||'').trim().slice(0,18);
  profile.bio=($('bioInput').value||'').trim().slice(0,90);
  profile.x=cleanHandle($('xInput').value);
  saveProfile(); pushMe();
  if(scene) buildAvatar();
  refreshHouse();
  $('start').style.display='none';
  $('hud').style.display='block';
  $('mini').style.display='block'; $('prog').style.display='block';
  $('sndBtn').style.display='flex'; $('langBtn').style.display='flex'; $('menuBtn').style.display='flex';
  jrnShow(true);
  if(isTouch){ $('viewBtn').style.display='flex'; $('runBtn').style.display='flex'; }
  camera.rotation.order='YXZ';
  $('photoBtn').style.display='flex';
  if(!isTouch && renderer) renderer.domElement.requestPointerLock();
  const iv=$('intro');
  iv.textContent=isTouch?tr('introTouch'):tr('introDesk');
  iv.style.display='block'; iv.style.opacity='1';
  clearTimeout(window.__introT1); clearTimeout(window.__introT2);
  window.__introT1=setTimeout(()=>{ iv.style.opacity='0'; },14000);
  window.__introT2=setTimeout(()=>{ iv.style.display='none'; },15000);
  updateHitBtn();   // obDone gates the button, so it has to be told
}
