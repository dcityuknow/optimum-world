/* =========================================================================
   THE RODEO: LarOs runs the mechanical bull at the Afterparty. Talk to him,
   Bobby jumps off, you climb on, a mud puddle spreads under the bull, and you
   hold on by pressing what it shows you: arrows first, then letters, faster
   and faster. Fall and it is the mud. Best times go on a shared leaderboard.
     Q.bm  met LarOs     Q.bb  your best, in tenths of a second
   ========================================================================= */
Object.assign(UI,{
  larRole:{en:"Rodeo host",ru:"Ведущий родео",uk:"Ведучий родео"},
  lar1:{en:"Hey. Yes, you. Bobby has been on that bull since the party started and he is not getting off on his own. Want to show him how it is done?",
    ru:"Эй. Да, ты. Бобби сидит на этом быке с самого начала вечеринки и сам слезать не собирается. Покажешь ему, как надо?",
    uk:"Гей. Так, ти. Боббі сидить на цьому бику від самого початку вечірки і сам злазити не збирається. Покажеш йому, як треба?"},
  lar2:{en:"Simple. You climb on and hold on. The bull shows you arrows, you press them. Then letters. And it only gets faster. Fall off and you land in the mud. Bulk.",
    ru:"Всё просто. Залезаешь и держишься. Бык показывает стрелки, ты жмёшь. Потом буквы. И дальше только быстрее. Свалишься, приземлишься в грязь. Бульк.",
    uk:"Все просто. Залазиш і тримаєшся. Бик показує стрілочки, ти тиснеш. Потім літери. І далі тільки швидше. Впадеш, приземлишся в грязюку. Бульк."},
  larHi:{en:"Back for more? The mud missed you.",ru:"Снова пришёл? Грязь по тебе скучала.",uk:"Знову прийшов? Грязюка за тобою скучила."},
  larBest:{en:"Your best is {s} seconds. The mud remembers.",ru:"Твой рекорд {s} секунд. Грязь всё помнит.",uk:"Твій рекорд {s} секунд. Грязюка все пам'ятає."},
  larAbout:{en:"LarOs. I run the rodeo. Day, night, does not matter. The eyes? I just do not sleep much.",
    ru:"LarOs. Я веду родео. Днём, ночью, без разницы. Глаза? Просто мало сплю.",
    uk:"LarOs. Я веду родео. Вдень, вночі, байдуже. Очі? Просто мало сплю."},
  rHow:{en:"How does it work?",ru:"Как это работает?",uk:"Як це працює?"},
  rRide:{en:"Ride the bull",ru:"Прокатиться на быке",uk:"Прокататися на бику"},
  rBoard:{en:"Leaderboard",ru:"Таблица лидеров",uk:"Лідерборд"},
  rdHold:{en:"Hold on!",ru:"Держись!",uk:"Тримайся!"},
  rdArrows:{en:"Arrows",ru:"Стрелки",uk:"Стрілочки"},
  rdLetters:{en:"Now letters!",ru:"Теперь буквы!",uk:"Тепер літери!"},
  rdLetterTag:{en:"Letters",ru:"Буквы",uk:"Літери"},
  rdFaster:{en:"Faster!",ru:"Быстрее!",uk:"Швидше!"},
  rdBest:{en:"Best",ru:"Рекорд",uk:"Рекорд"},
  rdKeyHint:{en:"Press it on the keyboard",ru:"Жми на клавиатуре",uk:"Тисни на клавіатурі"},
  rdBulk:{en:"Bulk!",ru:"Бульк!",uk:"Бульк!"},
  rdHeld:{en:"You held on for {s} s",ru:"Ты продержался {s} с",uk:"Ти протримався {s} с"},
  rdRecord:{en:"New record!",ru:"Новый рекорд!",uk:"Новий рекорд!"},
  rdBestIs:{en:"Your best: {s} s",ru:"Твой рекорд: {s} с",uk:"Твій рекорд: {s} с"},
  rdAgain:{en:"Again",ru:"Ещё раз",uk:"Ще раз"},
  rdExit:{en:"Climb out of the mud",ru:"Вылезти из грязи",uk:"Вилізти з грязюки"},
  rdQuips:{en:["Bulk. Classic.","The mud says hi.","Bobby lasted longer. Just saying.","That was almost elegant.","The bull would like a word."],
    ru:["Бульк. Классика.","Грязь передаёт привет.","Бобби держался дольше. Просто говорю.","Это было почти элегантно.","Бык хочет с тобой поговорить."],
    uk:["Бульк. Класика.","Грязюка передає привіт.","Боббі тримався довше. Просто кажу.","Це було майже елегантно.","Бик хоче з тобою поговорити."]},
  lbTitle:{en:"Rodeo leaderboard",ru:"Таблица лидеров родео",uk:"Лідерборд родео"},
  lbLoading:{en:"Loading",ru:"Загрузка",uk:"Завантаження"},
  lbEmpty:{en:"Nobody has ridden yet. Be the first.",ru:"Ещё никто не катался. Будь первым.",uk:"Ще ніхто не катався. Будь першим."},
  lbLocal:{en:"Only results from this device are shown, the shared board is not reachable right now.",
    ru:"Показаны только результаты с этого устройства, общая таблица сейчас недоступна.",
    uk:"Показано лише результати з цього пристрою, спільний лідерборд зараз недоступний."},
  lbYou:{en:"you",ru:"ты",uk:"ти"}
});
function trList(k){ const e=UI[k]; return (e&&(e[LANG]||e.en))||[]; }

/* LarOs: a silver head with a crown of silver spikes, glowing red eyes, a
   black robe tied at the neck with a rope, white hands, and a red glow behind
   him. Hex colours on a person go straight to the shader as linear values and
   come out lifted, so the black is given here already in linear terms. */
const linHex=h=>new THREE.Color(h).convertSRGBToLinear().getHex();
Object.assign(SKINS,{ laros:{id:'laros', mode:'demon', base:0x9AA1AA, skin:0x9AA1AA, hair:0xE2E6EA, style:'none',
  shirt:linHex(0x131316), sleeve:linHex(0x131316), inner:linHex(0x2A0D10), pants:linHex(0x131316)} });

let RODEO=null;        // everything the rodeo built, in one place
let BULLRIG=null;      // the bull, Bobby and the pit, handed over by the Afterparty
let RIDE_HELD=null;    // what was in your hand before you climbed on
let RIDE=null;         // the ride while it is on
let LB_CACHE=null, LB_AT=0;

function redGlowTex(){
  const S=128, c=cvs(S,S), g=c.getContext('2d');
  const r=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  r.addColorStop(0,'rgba(255,40,30,0.55)'); r.addColorStop(0.45,'rgba(200,20,20,0.22)'); r.addColorStop(1,'rgba(160,0,0,0)');
  g.fillStyle=r; g.fillRect(0,0,S,S);
  return new THREE.CanvasTexture(c);
}
/* A small studio for metal to reflect: a bright sky, a hard horizon and a
   dark floor. That contrast is what makes a surface read as silver rather
   than as grey paint. */
let CHROME_ENV=null;
function chromeEnv(){
  if(CHROME_ENV) return CHROME_ENV;
  const face=(st)=>{ const c=cvs(64,64), g=c.getContext('2d'), lg=g.createLinearGradient(0,0,0,64);
    st.forEach(s=>lg.addColorStop(s[0],s[1])); g.fillStyle=lg; g.fillRect(0,0,64,64); return c; };
  const side=face([[0,'#E6ECF2'],[0.40,'#B4BDC8'],[0.56,'#7E8794'],[0.60,'#30353D'],[1,'#16181D']]);
  const t=new THREE.CubeTexture([side,side,face([[0,'#E9EEF4'],[1,'#DCE3EB']]),face([[0,'#1A1C21'],[1,'#1A1C21']]),side,side]);
  t.encoding=THREE.sRGBEncoding; t.needsUpdate=true;
  return (CHROME_ENV=t);
}
/* the sides and back of the head: the same banded silver as the face */
function silverTex(back){ return pxTex((g,S)=>{
  const mg=g.createLinearGradient(0,0,0,S);
  mg.addColorStop(0,'#D3D8DE'); mg.addColorStop(.30,'#A6ADB6'); mg.addColorStop(.52,'#6E757F');
  mg.addColorStop(.70,'#9DA4AD'); mg.addColorStop(.85,'#C1C7CE'); mg.addColorStop(1,'#565D67');
  g.fillStyle=mg; g.fillRect(0,0,S,S);
  g.fillStyle='rgba(255,255,255,.26)';
  if(back){ g.fillRect(10,4,4,S-10); g.fillRect(44,10,3,S-22); }
  else { g.beginPath(); g.moveTo(14,0); g.lineTo(24,0); g.lineTo(10,S); g.lineTo(0,S); g.lineTo(0,30); g.closePath(); g.fill(); }
  g.fillStyle='rgba(22,24,30,.28)'; g.fillRect(0,0,3,S); g.fillRect(S-3,0,3,S);
}); }
function buildLaros(g,lx,lz,yaw){
  /* the party deck is 0.14 high, as the crowd on it stands; at zero he sank into the boards */
  const p=makePerson(g,{look:SKINS.laros, stand:1, a:[lx,lz], b:[lx,lz], baseYaw:yaw, baseY:0.14});
  const sl=h=>new THREE.Color(h).convertSRGBToLinear();
  const env=chromeEnv();
  const metal=(o)=>new THREE.MeshPhongMaterial(Object.assign({color:0xFFFFFF, specular:sl(0xF2F5F8), shininess:70,
    envMap:env, combine:THREE.MixOperation, reflectivity:0.38},o));
  const srgb=(t)=>{ t.encoding=THREE.sRGBEncoding; t.needsUpdate=true; return t; };
  /* black cloth, the same as the sleeves it hangs over */
  const robe=new THREE.MeshLambertMaterial({color:sl(0x131316)});
  const glove=metal({color:sl(0xE6E9ED), reflectivity:0.22, specular:sl(0x30343A), shininess:20});
  const hairM=metal({color:sl(0x8E99A8), specular:sl(0x9AA5B2), flatShading:true, reflectivity:0.3});
  /* the hair: a crown of silver spikes, swept up and back, with a few
     darker ones in among them so it has depth */
  const hairD=metal({color:sl(0x59616D), specular:sl(0x8A94A0), flatShading:true, reflectivity:0.26});
  const rs=seedRnd(4242);
  for(let i=0;i<18;i++){
    const a=i/18*Math.PI*2, ring=i%3===0?0.08:0.2+rs()*0.06;
    const x=Math.cos(a)*ring*1.2, z=Math.sin(a)*ring-0.03;
    const h=0.34+rs()*0.26, r=0.075+rs()*0.05;
    const sp=new THREE.Mesh(new THREE.ConeGeometry(r,h,5),i%3===1?hairD:hairM);
    sp.position.set(x,2.45+h*0.38,z);
    sp.rotation.set(-0.35+z*1.3-(z<0?0.25:0), 0, -x*1.7);
    sp.castShadow=true; p.add(sp);
  }
  /* the head turns to silver: every side gets the banded metal, the face
     keeps its features, and the eyes glow through an emissive map with only
     the eyes and the light round them, so they burn at night */
  const head=p.children.find(o=>o.isMesh && o.geometry && o.geometry.parameters &&
    o.geometry.parameters.width===0.56 && o.geometry.parameters.height===0.56);
  if(head && Array.isArray(head.material)){
    const old=head.material;
    /* the party light is warm; a cool tint on the metal keeps it silver
       instead of letting it drift to pale skin */
    /* no sun highlight on the flat sides of the head: a box face catches
       it all at once, and head on the whole face went white. The metal
       comes from the reflection and the painted bands instead. */
    const cool=sl(0xAEBCD2), dull=sl(0x0E1014);
    const side=metal({color:cool, map:srgb(silverTex(false)), reflectivity:0.45, specular:dull, shininess:20});
    const fm=metal({color:cool, map:srgb(old[4].map), reflectivity:0.36, specular:dull, shininess:20});
    fm.emissiveMap=pxTex((g2,S)=>{
      g2.fillStyle='#000'; g2.fillRect(0,0,S,S);
      const r2=g2.createRadialGradient(32,33,1,32,32,16); r2.addColorStop(0,'rgba(120,10,8,.9)'); r2.addColorStop(1,'rgba(0,0,0,0)');
      g2.fillStyle=r2; g2.fillRect(8,16,48,32);
      g2.fillStyle='#D8160C'; g2.fillRect(14,32,12,4); g2.fillRect(38,32,12,4);
      g2.fillStyle='#FF5A40'; g2.fillRect(18,33,5,2); g2.fillRect(41,33,5,2);
    });
    fm.emissive=new THREE.Color(0xFFFFFF);
    head.material=[side,side,metal({color:sl(0xA4AEBB), specular:dull, shininess:20}),metal({color:sl(0x5E6672), specular:dull, shininess:20}),fm,
      metal({color:cool, map:srgb(silverTex(true)), specular:dull, shininess:20})];
    old.forEach(m=>{ if(m.map && m.map!==fm.map) m.map.dispose(); m.dispose(); });
  }
  /* the robe: a skirt over the legs and a rope knotted at the neck */
  const sk=B(p,0.74,0.62,0.44,robe,0,0.82,0,false,true);
  const rope=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.035,6,18),new THREE.MeshLambertMaterial({color:sl(0x2A2522)}));
  rope.rotation.x=Math.PI/2; rope.position.set(0,1.9,0.02); p.add(rope);
  const knot=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),rope.material); knot.position.set(0.05,1.85,0.2); p.add(knot);
  const lim=p.userData.limbs;
  if(lim) for(const a of [lim.armL,lim.armR]){
    B(a,0.3,0.28,0.32,robe,0,-0.68,0,false,false);         // the wide cuff
    B(a,0.16,0.2,0.18,glove,0,-0.9,0.02,false,false);       // white glove
  }
  /* the red light he stands in */
  const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:redGlowTex(), transparent:true, depthWrite:false,
    blending:THREE.AdditiveBlending, toneMapped:false}));
  aura.scale.set(3.4,4.0,1); aura.position.set(0,1.6,-0.35); p.add(aura);
  anims.push(t=>{ if(!PARTY_ON) return; aura.material.opacity=0.75+Math.sin(t*2.2)*0.2; });
  return p;
}

/* the shared board, on a stand beside the pit */
function boardTex(rows){
  const W=1024, H=640, c=cvs(W,H), g=c.getContext('2d');
  g.fillStyle='#211B17'; g.fillRect(0,0,W,H);
  g.fillStyle='#FFB04A'; g.textAlign='center'; g.textBaseline='middle';
  g.font='900 96px Impact, Haettenschweiler, "Arial Black", sans-serif'; g.fillText('RODEO',W/2,92);
  g.fillStyle='rgba(255,236,210,.7)'; g.font='700 36px ui-sans-serif, Helvetica, Arial'; g.fillText('TOP 5',W/2,160);
  g.textBaseline='middle';
  if(!rows || !rows.length){
    g.fillStyle='rgba(255,236,210,.75)'; g.font='600 40px ui-sans-serif, Helvetica, Arial';
    g.fillText(tr('lbEmpty'),W/2,370);
  } else rows.slice(0,5).forEach((r,i)=>{
    const y=240+i*80;
    g.textAlign='left'; g.fillStyle=i===0?'#FFD27A':'#F4E6D2'; g.font='800 46px ui-sans-serif, Helvetica, Arial';
    g.fillText((i+1)+'.',90,y);
    let nm=r.nick||'anon'; g.font='700 46px ui-sans-serif, Helvetica, Arial';
    while(g.measureText(nm).width>560 && nm.length>3) nm=nm.slice(0,-2);
    g.fillText(nm,170,y);
    g.textAlign='right'; g.font='800 46px ui-sans-serif, Helvetica, Arial';
    g.fillText(r.score.toFixed(1)+' s',W-90,y);
  });
  const t=tex(c); t.encoding=THREE.sRGBEncoding; return t;
}
function buildRodeo(g,PX,PZ,BUX,BUZ){
  const R=BULLRIG; if(!R) return;
  const C={x:PX+BUX, z:PZ+BUZ};
  /* LarOs stands at the south west of the pit, side on to the dance floor */
  const lx=BUX-6.2, lz=BUZ+6.6;
  const laros=buildLaros(g,lx,lz,Math.atan2(BUX-lx,BUZ-lz));
  addMarker(laros,3.4,()=> (PARTY_ON && !Q.bm) ? 0 : 2);
  const spot={x:PX+lx+0.6, z:PZ+lz-0.6, r:3.4, prio:1, accent:C.peach, data:{name:'LarOs'},
    when:()=> PARTY_ON && !RIDE, label:()=> tr('talkTo')+' LarOs',
    act:()=>{ openDialog(Q.bm ? 'lar_hi' : 'lar_1'); }};
  spots.push(spot);
  /* the board, on two posts, turned to the dance floor */
  const bd=new THREE.Group(); bd.position.set(BUX+1.5,0,BUZ+8.6); bd.rotation.y=Math.PI+0.5; g.add(bd);
  const post=new THREE.MeshLambertMaterial({color:0x5A4330});
  B(bd,0.16,3.6,0.16,post,-1.55,1.8,0,false,true); B(bd,0.16,3.6,0.16,post,1.55,1.8,0,false,true);
  B(bd,3.3,2.12,0.12,new THREE.MeshLambertMaterial({color:0x3A2C22}),0,2.75,-0.02,false,true);
  const boardM=new THREE.MeshBasicMaterial({map:boardTex(null), toneMapped:false});
  const face=new THREE.Mesh(new THREE.PlaneGeometry(3.1,1.94),boardM); face.position.set(0,2.75,0.05); bd.add(face);
  colliders.push(worldAABB(g,1,1,BUX+1.5,BUZ+8.6));
  /* the mud: three overlapping glossy pools, so the edge is not a perfect circle */
  const mudM=new THREE.MeshPhongMaterial({color:0x4A3423, shininess:70, specular:0x6E5A44, transparent:true, opacity:1});
  const mud=new THREE.Group(); mud.position.y=1.012; mud.visible=false; R.pit.add(mud);
  [[0,0,3.3],[1.2,0.6,2.3],[-1.0,-0.9,2.4],[0.4,-1.6,1.8]].forEach(q=>{
    const m=new THREE.Mesh(new THREE.CircleGeometry(q[2],36),mudM); m.rotation.x=-Math.PI/2;
    m.position.set(q[0],0.002*q[2],q[1]); mud.add(m);
  });
  const splashM=new THREE.MeshLambertMaterial({color:0x4A3423});
  const drops=[]; for(let i=0;i<28;i++){ const d=new THREE.Mesh(new THREE.SphereGeometry(0.07+Math.random()*0.09,6,5),splashM); d.visible=false; scene.add(d); drops.push({m:d,v:[0,0,0]}); }
  const ringM=new THREE.MeshBasicMaterial({color:0x5A4330, transparent:true, opacity:0.8, side:THREE.DoubleSide, depthWrite:false});
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.3,0.5,40),ringM); ring.rotation.x=-Math.PI/2; ring.visible=false; scene.add(ring);
  RODEO={C, laros, spot, lx:PX+lx, lz:PZ+lz, boardM, mud, mudM, drops, ring};
  /* fetch the board the first time you come near the party */
  anims.push(()=>{
    if(!PARTY_ON || RODEO.fetched) return;
    if(Math.hypot(player.x-C.x, player.z-C.z)<60){ RODEO.fetched=1; lbLoad().then(rows=>{ boardM.map=boardTex(rows); boardM.needsUpdate=true; }); }
  });
}
