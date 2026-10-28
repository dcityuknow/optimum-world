/* ------------------------------ DRAWN SKINS ------------------------------ */
const SKINS={
 /* baised: mid brown hair worn forward, full beard, plain white tee with the
    optimum tag on the chest, dark jeans */
 baised:{skin:0xF2CCA6,hair:0xA57C4C,brow:0x7C5A33,style:'short',
   beard:1,beardCol:0x8E6438,rim:'#8A5A46',
   shirt:0xF5F3EF,sleeve:0xF5F3EF,inner:0xF5F3EF,pants:0x343A43,lip:'#BC7A6A',
   tag:'optimum'},
 muriel:{skin:0xF0CBA8,hair:0x8A6236,brow:0x6E4E2C,style:'long',longHair:1,glasses:1,rim:'#8A5A46',
   shirt:0xEFEAE1,sleeve:0xEFEAE1,inner:0x33363C,pants:0x3C4148,lip:'#C07068'},
 kishori:{skin:0xA9744B,hair:0x1E1A17,style:'short',shirt:0x23262C,sleeve:0x23262C,inner:0xF2F2F0,pants:0x2B2F36,lip:'#8E5348'},
 kent:{skin:0xEFC9A4,hair:0x14110F,style:'short',shirt:0xBEC3C8,sleeve:0xF3F2EF,inner:0xEDE7DA,pants:0x33363C,lip:'#B0685E'},
 lewej:{skin:0x6B4630,hair:0x1A1A1A,style:'cap',cap:0x161616,phones:0xA8C4DA,beard:1,beardCol:0x241C16,
   shirt:0x6A4FA3,sleeve:0x6A4FA3,inner:0x6A4FA3,pants:0x2B2F36,lip:'#7E4A42'},
 eli:{skin:0xE8B98F,hair:0x3A2A20,brow:0x33251C,beard:1,beardCol:0x33251C,style:'short',
   shirt:0x414B39,sleeve:0x414B39,inner:0x1E2430,pants:0x2B2F36,lip:'#A9635A'},
 jeffrey:{skin:0x5E3A26,hair:0x14100D,style:'cap',cap:0x6B665F,beard:1,beardCol:0x1A1512,
   shirt:0xEDEAE3,sleeve:0xEDEAE3,inner:0xE2DED5,pants:0x2B2F36,lip:'#7A463D'},
 chandler:{skin:0xF0CDA6,hair:0xC9A063,brow:0xA98548,style:'short',shirt:0x1E2740,sleeve:0x1E2740,inner:0x1E2740,pants:0x33363C,lip:'#B0685E'},
 nancy:{skin:0xF2D5B8,hair:0xE6E4DF,brow:0xC9C5BC,style:'bob',longHair:1,glasses:1,rim:'#B6A06A',
   shirt:0x2C6FC4,sleeve:0x2C6FC4,inner:0x2C6FC4,pants:0x3C4148,lip:'#C4756E'},
 sriram:{skin:0xA0693F,hair:0x8C8782,brow:0x6E6A66,style:'short',moustache:1,beardCol:0x8C8782,
   shirt:0x23273A,sleeve:0x23273A,inner:0xBACCE0,pants:0x2B2F36,lip:'#8E5348'},
 /* umpia: messy dark hair under a beige cap, a smug half lidded look, black hoodie */
 umpia:{id:'umpia',skin:0xF1C29A,hair:0x2B2320,brow:0x241C18,style:'spiky',smirk:1,eye:0x2A1E17,capBand:'#E4D1AB',
   shirt:0x1E2024,sleeve:0x1E2024,inner:0x2A2D32,pants:0x2A2E35,lip:'#A8604F'},
 /* MiReTu: a skull with the mask pushed up and a grin that does not quit */
 miretu:{id:'miretu',mode:'skull',base:0xEEF0F2,skin:0xEEF0F2,hair:0xEEF0F2,style:'none',
   shirt:0x29314C,sleeve:0x29314C,inner:0x29314C,pants:0x1F2438}
};
const PICS={
 peg:'assets/images/portraits/peg.jpg',
 katana:'assets/images/portraits/katana.jpg',
 storm:'assets/images/portraits/storm.jpg',
 scarf:'assets/images/portraits/scarf.jpg',
 varsity:'assets/images/portraits/varsity.jpg',
 aqc:'assets/images/portraits/aqc.jpg',
 chrome:'assets/images/portraits/chrome.jpg',
 mask:'assets/images/portraits/mask.jpg',
 pepe:'assets/images/portraits/pepe.jpg',
 helmet:'assets/images/portraits/helmet.jpg',
 robin:'assets/images/portraits/robin.jpg',
 fox:'assets/images/portraits/fox.jpg'
};

const ROLE={mod:{k:'mod',c:'#4FA3F7'},mum:{k:'mum',c:'#EE6C55'}};
const ROLES=[
 {id:'newbie',   c:0x35D6A4, label:{en:'Optimum Newbie',ru:'Optimum Newbie',uk:'Optimum Newbie'}},
 {id:'observer', c:0x8B93F7, label:{en:'Observer',ru:'Observer',uk:'Observer'}},
 {id:'refined',  c:0xC8A29E, g:['#947978','#FCCCC4'], label:{en:'Refined',ru:'Refined',uk:'Refined'}},
 {id:'chronicler',c:0x64E27F,label:{en:'Chronicler',ru:'Chronicler',uk:'Chronicler'}},
 {id:'optimized',c:0xF0E0C0, label:{en:'Optimized',ru:'Optimized',uk:'Optimized'}},
 {id:'realog',   c:0xF0A030, label:{en:'Real OG',ru:'Real OG',uk:'Real OG'}},
 {id:'mumbassador',c:0xEE6C55,label:{en:'Mumbassador',ru:'Mumbassador',uk:'Mumbassador'}},
 {id:'mod',      c:0x4FA3F7, label:{en:'MOD',ru:'MOD',uk:'MOD'}}
];
function roleOf(id){ for(let i=0;i<ROLES.length;i++) if(ROLES[i].id===id) return ROLES[i]; return ROLES[0]; }
function roleLabel(id){ const r=roleOf(id); return r.label[LANG]||r.label.en; }
const CROWD=[
 {id:'peg',nick:'Pegasus',x:'https://x.com/ada_pegasus',role:'mum',mode:'horse',base:0xF4F2EC,skin:0xF4F2EC,hair:0xD8D2C4,style:'none',
  wings:0xFFFFFF,ears:0xF4F2EC,mane:0xCFC8B8,bigWings:1,
  shirt:0xF2F0E9,sleeve:0xF2F0E9,inner:0xD9D4C8,pants:0xE6E2D6},
 {id:'katana',nick:'samurai.itan',x:'https://x.com/samurai_itan',role:'mum',mode:'human',skin:0xF0C9A0,hair:0x141210,brow:0x141210,style:'spiky',stubble:0x6E5A48,
  shirt:0x191919,sleeve:0x191919,inner:0x191919,pants:0x2B2F36,lip:'#B0685E',katana:1},
 {id:'storm',nick:'Flash',x:'https://x.com/cryptooflashh',role:'mod',mode:'hood',base:0x0D1016,skin:0x0D1016,hair:0x0D1016,style:'none',hood:0x141A22,
  shirt:0x161C24,sleeve:0x161C24,inner:0x161C24,pants:0x11151B,storm:1},
 {id:'scarf',nick:'CryptoSundayz',x:'https://x.com/cryptosundayz',role:'mod',mode:'human',skin:0xD9A278,hair:0x121212,brow:0x121212,style:'spiky',scarf:0xE8E2D2,
  shirt:0x1B1F26,sleeve:0x1B1F26,inner:0x1B1F26,pants:0x2E3440,lip:'#A05F52'},
 {id:'varsity',nick:'TheBlockBoy',x:'https://x.com/TheBl0ckBoy',role:'mum',mode:'human',skin:0xF2C79A,hair:0xB4602A,brow:0x8A4720,style:'spiky',smile:1,
  shirt:0x2E5E43,sleeve:0xF0EDE6,inner:0x1E3A2C,pants:0x2B2F36,lip:'#C0705F'},
 {id:'aqc',nick:'AQCCapital',x:'https://x.com/aqccapital',role:'mod',mode:'visor',base:0xF7F7F7,skin:0xF7F7F7,hair:0xF7F7F7,style:'none',
  shirt:0x1C1F24,sleeve:0x1C1F24,inner:0x8CE23F,pants:0xF0F0EE},
 {id:'chrome',nick:'Shahriar',x:'https://x.com/shariaronchain',role:'mod',mode:'chrome',base:0x2B3036,skin:0x2B3036,hair:0x2B3036,style:'none',
  shirt:0x24282D,sleeve:0x24282D,inner:0x24282D,pants:0x1A1D21},
 {id:'mask',nick:'Jultoshi',x:'https://x.com/PostMaklone',role:'mum',mode:'mask',base:0x121317,skin:0x121317,hair:0x121317,style:'none',
  shirt:0x17181C,sleeve:0x17181C,inner:0x8A5CD1,pants:0x17181C},
 {id:'pepe',nick:'TG',x:'https://x.com/tgogayi',role:'mod',mode:'bandit',base:0xE8A05C,skin:0xE8A05C,hair:0xE8A05C,style:'none',
  shirt:0xF2F2F0,sleeve:0xF2F2F0,inner:0xF2F2F0,pants:0x3A5A8C},
 {id:'helmet',nick:'jimmyfx',x:'https://x.com/JimmyHope_',role:'mum',mode:'goggles',base:0xC9CBD0,skin:0xC9CBD0,hair:0x5C7A34,style:'none',
  shirt:0x5C6B3A,sleeve:0x5C6B3A,inner:0xE8E8E4,pants:0x4A5730},
 {id:'robin',nick:'zumorito',x:'https://x.com/Isaacjohnibiam',role:'mum',mode:'domino',base:0xD9A87E,skin:0xD9A87E,hair:0x141414,style:'spiky',
  shirt:0x141414,sleeve:0x141414,inner:0xF2F2F0,pants:0x141414,lip:'#A05F52'},
 {id:'fox',nick:'vssema',x:'https://x.com/vssema11',role:'mum',mode:'beast',base:0xC0392B,skin:0xC0392B,hair:0xC0392B,style:'none',ears:0xC0392B,
  shirt:0xC0392B,sleeve:0x2B2F36,inner:0x1A1A1A,pants:0x24282D,
  /* far end of the Community street: the samurai says to go find him, so
     finding him should take a walk past a few houses */
  path:[[148,-1.5],[196,-1.5]]}
];
const HX=n=>'#'+n.toString(16).padStart(6,'0');
function pxTex(draw){
  const S=64, c=cvs(S,S), g=c.getContext('2d');
  draw(g,S);
  const t=new THREE.CanvasTexture(c);
  t.magFilter=THREE.NearestFilter;
  t.minFilter=THREE.NearestFilter;
  t.generateMipmaps=false;
  return t;
}
function hairTop(c){ return c.style==='cap'?(c.cap||0x161616):c.hair; }
function drawHair(g,S,c){
  const st=c.style;
  if(st==='none'||st==='bald') return;
  const top = st==='cap'?20:(st==='long'?16:(st==='bob'?18:13));
  g.fillStyle=HX(hairTop(c));
  g.fillRect(0,0,S,top);
  if(st==='spiky'){
    g.fillRect(4,top,9,7); g.fillRect(18,top,8,5); g.fillRect(34,top,9,6); g.fillRect(49,top,9,4);
  } else if(st!=='cap'){ g.fillRect(6,top,16,4); g.fillRect(42,top,16,4); }
  if(st==='fringe'){
    // a soft swept fringe with uneven strands, closer to a drawn portrait
    g.fillStyle=HX(hairTop(c));
    g.fillRect(3,top,11,9); g.fillRect(15,top,9,12); g.fillRect(25,top,8,7);
    g.fillRect(34,top,10,11); g.fillRect(45,top,9,8); g.fillRect(53,top,8,5);
    g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(16,top-6,10,5); g.fillRect(38,top-7,9,5);
    g.fillStyle=HX(c.hair); g.fillRect(0,0,6,top+18); g.fillRect(S-6,0,6,top+18);
  }
  if(st==='cap'){ g.fillStyle='rgba(0,0,0,.20)'; g.fillRect(0,top,S,3); }
  if(st==='long'||st==='bob'){ g.fillStyle=HX(c.hair); g.fillRect(0,0,7,S); g.fillRect(S-7,0,7,S); }
  else { g.fillStyle=HX(c.hair); g.fillRect(0,0,4,top+8); g.fillRect(S-4,0,4,top+8); }
}
function faceTex(c){ return pxTex((g,S)=>{
  const m=c.mode||'human';
  g.fillStyle=HX(c.base||c.skin); g.fillRect(0,0,S,S);
  g.fillStyle='rgba(0,0,0,.05)'; g.fillRect(0,0,5,S); g.fillRect(S-5,0,5,S);

  if(m==='human'){
    drawHair(g,S,c);
    if(c.beard){
      g.fillStyle=HX(c.beardCol||c.hair);
      g.fillRect(9,45,46,17); g.fillRect(8,33,6,24); g.fillRect(50,33,6,24);
    }
    if(c.stubble){ g.fillStyle=HX(c.stubble); g.globalAlpha=.35; g.fillRect(20,48,24,10); g.globalAlpha=1; }
    g.fillStyle=HX(c.brow||c.hair); g.fillRect(13,25,15,3); g.fillRect(36,25,15,3);
    g.fillStyle='#F6F3EF'; g.fillRect(13,30,15,8); g.fillRect(36,30,15,8);
    g.fillStyle=HX(c.eye||0x33231A); g.fillRect(18,31,7,6); g.fillRect(41,31,7,6);
    g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(19,32,2,2); g.fillRect(42,32,2,2);
    if(c.capBand){ g.fillStyle=c.capBand; g.fillRect(0,0,S,9); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,9,S,2); }
    if(c.smirk){
      /* heavy lids, and one brow a touch higher than the other */
      g.fillStyle=HX(c.skin); g.fillRect(13,30,15,3); g.fillRect(36,30,15,3); g.fillRect(36,25,15,3);
      g.fillStyle='rgba(40,25,18,.85)'; g.fillRect(13,32,15,1); g.fillRect(36,32,15,1);
      g.fillStyle=HX(c.brow||c.hair); g.fillRect(36,23,15,3); g.fillRect(12,26,4,2);
    }
    g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(29,39,7,7);
    if(c.moustache){ g.fillStyle=HX(c.beardCol||c.hair); g.fillRect(21,47,22,5); }
    g.fillStyle=c.lip||'#A9635A';
    if(c.smirk){ g.fillRect(22,53,15,2); g.fillRect(36,51,5,2); g.fillRect(40,49,3,2); }
    else if(c.smile){ g.fillRect(22,52,20,3); g.fillRect(20,50,3,3); g.fillRect(41,50,3,3); g.fillStyle='#FFFFFF'; g.fillRect(24,53,16,2); }
    else { g.fillRect(24,53,16,4); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(24,53,16,1); }
    if(c.glasses){
      g.strokeStyle=c.rim||'#5A4A3A'; g.lineWidth=2.2;
      g.strokeRect(11,28,18,11); g.strokeRect(35,28,18,11);
      g.beginPath(); g.moveTo(29,33); g.lineTo(35,33);
      g.moveTo(11,31); g.lineTo(2,29); g.moveTo(53,31); g.lineTo(62,29); g.stroke();
    }
    return;
  }
  if(m==='demon'){
    /* LarOs: a silver head, lit from below by his own red eyes. Metal reads
       through hard bands: bright at the brow, a dark band under the eyes, a
       cold light lower down, and a white streak where the light catches it */
    const mg=g.createLinearGradient(0,0,0,S);
    mg.addColorStop(0,'#DCE0E5'); mg.addColorStop(.28,'#AEB5BE'); mg.addColorStop(.50,'#737A84');
    mg.addColorStop(.68,'#A3AAB3'); mg.addColorStop(.83,'#C9CED4'); mg.addColorStop(1,'#5C636D');
    g.fillStyle=mg; g.fillRect(0,0,S,S);
    g.fillStyle='rgba(255,255,255,.30)';
    g.beginPath(); g.moveTo(5,6); g.lineTo(12,6); g.lineTo(5,44); g.lineTo(0,44); g.lineTo(0,24); g.closePath(); g.fill();
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(54,8,3,30);
    g.fillStyle='rgba(22,24,30,.30)'; g.fillRect(0,0,4,S); g.fillRect(S-4,0,4,S);
    const rg=g.createRadialGradient(32,30,1,32,28,22);
    rg.addColorStop(0,'rgba(240,30,24,.72)'); rg.addColorStop(.55,'rgba(210,20,20,.32)'); rg.addColorStop(1,'rgba(200,20,20,0)');
    g.fillStyle=rg; g.fillRect(6,8,52,34);
    g.fillStyle=HX(c.hair); g.fillRect(0,0,S,6);
    const fr=[[0,6,7],[6,6,6],[12,6,8],[20,6,5],[25,6,7],[33,6,6],[39,6,8],[47,6,6],[53,6,8],[59,6,5]];
    fr.forEach(q=>{
      g.beginPath(); g.moveTo(q[0],q[1]); g.lineTo(q[0]+q[2],q[1]); g.lineTo(q[0]+q[2]*0.45,q[1]+q[2]*1.1); g.closePath(); g.fill(); });
    g.fillStyle='rgba(60,66,76,.45)';
    fr.forEach(q=>{
      g.beginPath(); g.moveTo(q[0]+q[2]*0.5,q[1]); g.lineTo(q[0]+q[2],q[1]); g.lineTo(q[0]+q[2]*0.45,q[1]+q[2]*1.1); g.closePath(); g.fill(); });
    g.strokeStyle='#160A0B'; g.lineWidth=1.8;
    g.beginPath(); g.arc(32,18,3.6,Math.PI*1.0,Math.PI*0.0,false); g.stroke();
    g.fillStyle='#160A0B'; g.fillRect(31,15,2,7);
    g.fillStyle='#1E1216';
    g.beginPath(); g.moveTo(10,26); g.lineTo(27,30); g.lineTo(27,32); g.lineTo(10,28.5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(54,26); g.lineTo(37,30); g.lineTo(37,32); g.lineTo(54,28.5); g.closePath(); g.fill();
    g.fillStyle='#E81C12'; g.fillRect(14,32,12,4); g.fillRect(38,32,12,4);
    g.fillStyle='#FF8A70'; g.fillRect(18,33,5,2); g.fillRect(41,33,5,2);
    g.fillStyle='rgba(30,32,40,.35)'; g.fillRect(30,38,4,8);
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(29,38,1,7);
    g.fillStyle='#3B0C10';
    g.beginPath(); g.moveTo(18,49); g.quadraticCurveTo(32,57,46,47); g.lineTo(46,49); g.quadraticCurveTo(32,60,18,51); g.closePath(); g.fill();
    g.fillStyle='#ECEFF2'; g.fillRect(24,51,15,1);
    return;
  }
  if(m==='skull'){
    /* the mask pushed up on the forehead, its strap under it */
    g.fillStyle='#D9D5F5'; g.fillRect(0,0,S,16);
    g.fillStyle='#353A70'; g.fillRect(0,16,S,3);
    { const ic=(typeof iconTint==='function') ? iconTint('#1E2025') : null;
      if(ic) g.drawImage(ic,19,1.5,26,26*336/616); }
    /* sockets: flat topped, bored, a little heavy */
    g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(11,23,17,3); g.fillRect(36,23,17,3);
    g.fillStyle='#141519'; g.fillRect(12,26,15,9); g.fillRect(37,26,15,9);
    g.fillStyle='rgba(255,255,255,.20)'; g.fillRect(14,27,5,1); g.fillRect(39,27,5,1);
    g.fillStyle='#141519'; g.fillRect(29,38,6,3); g.fillRect(30,41,4,2);
    /* the grin */
    g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(9,43,5,12); g.fillRect(50,43,5,12);
    g.fillStyle='#141519'; g.fillRect(12,45,40,14);
    g.fillStyle='#FAFAFA'; g.fillRect(14,47,36,10);
    g.fillStyle='#141519'; for(let x=19;x<50;x+=6) g.fillRect(x,47,1,10); g.fillRect(14,51,36,1);
    return;
  }
  if(m==='visor'){
    g.fillStyle='#1C1F24'; g.fillRect(3,23,58,20);
    g.fillStyle='#2C333D'; g.fillRect(7,26,50,13);
    g.fillStyle='#0E1116'; g.fillRect(0,26,7,14);
    g.fillStyle='#3B4450'; g.fillRect(26,29,7,7); g.fillRect(33,31,7,5);
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(10,27,14,3);
    g.fillStyle='rgba(0,0,0,.30)'; g.fillRect(27,52,10,2);
    return;
  }
  if(m==='hood'){
    g.fillStyle='#0B0E13'; g.fillRect(0,0,S,S);
    g.fillStyle='#DFF3FF'; g.fillRect(13,29,15,5); g.fillRect(36,29,15,5);
    g.fillStyle='#8FD8FF'; g.fillRect(13,33,11,2); g.fillRect(40,33,11,2);
    return;
  }
  if(m==='chrome'){
    g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(8,10,10,34);
    g.fillStyle='rgba(255,70,90,.20)'; g.fillRect(0,6,7,40);
    g.fillStyle='rgba(80,255,190,.18)'; g.fillRect(S-8,8,8,38);
    g.fillStyle='#171B1F'; g.fillRect(14,31,14,5); g.fillRect(36,31,14,5);
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(28,42,8,10);
    return;
  }
  if(m==='mask'){
    g.fillStyle='#8A5CD1'; g.fillRect(9,24,20,5); g.fillRect(35,24,20,5);
    g.fillStyle='#C9A98E'; g.fillRect(13,30,14,7); g.fillRect(37,30,14,7);
    g.fillStyle='#2A1C16'; g.fillRect(17,31,6,5); g.fillRect(41,31,6,5);
    g.fillStyle='#7A4FC0'; g.fillRect(19,44,26,11);
    g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(19,44,26,2);
    return;
  }
  if(m==='bandit'){
    g.fillStyle='#141414'; g.fillRect(4,25,56,15);
    g.fillStyle='#FFFFFF'; g.fillRect(12,27,15,11); g.fillRect(37,27,15,11);
    g.fillStyle='#141414'; g.fillRect(17,30,6,6); g.fillRect(42,30,6,6);
    g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(14,50,36,3);
    return;
  }
  if(m==='domino'){
    drawHair(g,S,c);
    g.fillStyle='#141414'; g.fillRect(7,25,50,13);
    g.fillStyle='#FFFFFF'; g.fillRect(11,27,17,8); g.fillRect(36,27,17,8);
    g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(29,41,7,6);
    g.fillStyle=c.lip||'#A05F52'; g.fillRect(26,52,12,3);
    return;
  }
  if(m==='beast'){
    g.fillStyle=HX(c.base); g.fillRect(0,0,S,20);
    g.fillStyle='#8E2B20'; g.fillRect(0,18,S,3);
    g.fillStyle='#2F5FA8'; g.fillRect(5,21,54,30);
    g.fillStyle='#25488040'; g.fillRect(5,21,54,3);
    g.fillStyle='#FFFFFF'; g.fillRect(11,27,16,13); g.fillRect(37,27,16,13);
    g.fillStyle='#111318'; g.fillRect(16,31,7,7); g.fillRect(42,31,7,7);
    g.fillStyle='#E8862B'; g.fillRect(26,43,12,9);
    g.fillStyle='#B8641C'; g.fillRect(26,50,12,2);
    return;
  }
  if(m==='horse'){
    g.fillStyle='#F4F2EC'; g.fillRect(0,0,S,S);
    g.fillStyle=HX(c.mane||0xCFC8B8); g.fillRect(0,0,S,11);
    g.fillRect(24,0,16,20);
    g.fillStyle='#E7E2D6'; g.fillRect(19,34,26,27);
    g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(19,34,26,2);
    g.fillStyle='#241F1A'; g.fillRect(7,24,13,9); g.fillRect(44,24,13,9);
    g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(9,26,3,3); g.fillRect(46,26,3,3);
    g.fillStyle='#2B241D'; g.fillRect(24,47,6,7); g.fillRect(34,47,6,7);
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(24,58,16,2);
    g.fillStyle='rgba(0,0,0,.06)'; g.fillRect(0,0,5,S); g.fillRect(S-5,0,5,S);
    return;
  }
  if(m==='goggles'){
    g.fillStyle=HX(c.hair); g.fillRect(0,0,S,19);
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,19,S,3);
    g.fillStyle='#7A2C46'; g.fillRect(4,25,56,17);
    g.fillStyle='#E86FA0'; g.fillRect(18,28,12,11); g.fillRect(28,30,4,7); g.fillRect(32,28,14,11);
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(24,52,16,2);
    return;
  }
}); }
function sideTex(c){ return pxTex((g,S)=>{
  g.fillStyle=HX(c.base||c.skin); g.fillRect(0,0,S,S);
  if(c.style==='long'||c.style==='bob'){ g.fillStyle=HX(c.hair); g.fillRect(0,0,S,S); return; }
  if(c.style!=='none'&&c.style!=='bald'){ g.fillStyle=HX(hairTop(c)); g.fillRect(0,0,S,c.style==='cap'?22:16); }
  if(c.beard){ g.fillStyle=HX(c.beardCol||c.hair); g.fillRect(0,42,26,22); }
  g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(40,32,9,13);
}); }
function backTex(c){ return pxTex((g,S)=>{
  g.fillStyle=HX(c.base||c.skin); g.fillRect(0,0,S,S);
  if(c.style==='none'||c.style==='bald') return;
  g.fillStyle=HX(hairTop(c));
  g.fillRect(0,0,S,(c.style==='long'||c.style==='bob')?S:(c.style==='cap'?32:28));
}); }
function torsoTex(c){ return pxTex((g,S)=>{
  g.fillStyle=HX(c.shirt); g.fillRect(0,0,S,S);
  g.fillStyle=HX(c.inner||c.shirt);
  g.beginPath(); g.moveTo(22,0); g.lineTo(42,0); g.lineTo(32,20); g.closePath(); g.fill();
  g.fillStyle='rgba(0,0,0,.09)'; g.fillRect(31,20,3,S-20);
  g.fillStyle='rgba(0,0,0,.06)'; g.fillRect(0,0,4,S); g.fillRect(S-4,0,4,S);
}); }
