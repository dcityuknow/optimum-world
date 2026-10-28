/* ------------------------------ TEXTURES ------------------------------ */
function cvs(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
let MAXANISO=8;
function tex(c){ const t=new THREE.CanvasTexture(c); t.anisotropy=MAXANISO; return t; }

function signTexture(title, sub, accentHex){
  const c=cvs(1024,256), g=c.getContext('2d');
  g.fillStyle='#282C34'; g.fillRect(0,0,1024,256);
  g.fillStyle='#FFFBFB'; g.textAlign='center'; g.textBaseline='middle';
  let s=84; g.font='800 '+s+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(title.toUpperCase()).width>920 && s>36){ s-=4; g.font='800 '+s+'px ui-sans-serif, Helvetica, Arial'; }
  g.fillText(title.toUpperCase(), 512, 92);
  g.font='400 38px ui-sans-serif, Helvetica, Arial'; g.fillStyle='#B0BED1';
  g.fillText(sub, 512, 166);
  return tex(c);
}
/* Break text into lines that fit a width, at most maxN of them; if it still
   does not fit, the last line ends in an ellipsis instead of running off the
   edge of the card. */
function wrapText(g, lines, maxW, maxN){
  const out=[];
  for(const raw of lines){
    if(!raw) continue;
    let cur='';
    for(let w of String(raw).split(/\s+/)){
      /* a single word wider than the card (a long link) is cut to fit */
      while(g.measureText(w).width>maxW && w.length>1) w=w.slice(0,-1);
      const t=cur?cur+' '+w:w;
      if(g.measureText(t).width<=maxW) cur=t;
      else { if(cur) out.push(cur); cur=w; }
    }
    if(cur) out.push(cur);
  }
  if(out.length>maxN){
    out.length=maxN;
    let l=out[maxN-1];
    while(l.length && g.measureText(l+'\u2026').width>maxW) l=l.slice(0,-1);
    out[maxN-1]=l.replace(/\s+$/,'')+'\u2026';
  }
  return out;
}
function plaqueTexture(eyebrow, title, lines, accentHex){
  const c=cvs(900,560), g=c.getContext('2d');
  g.fillStyle='#FFFBFB'; g.fillRect(0,0,900,560);
  g.strokeStyle='#39404A'; g.lineWidth=10; g.strokeRect(5,5,890,550);
  g.textAlign='left'; g.textBaseline='top';
  g.fillStyle='#7C8A99'; g.font='700 30px ui-sans-serif, Helvetica, Arial';
  g.fillText(eyebrow.toUpperCase(), 56, 44);
  g.fillStyle='#282C34';
  let s=72; g.font='800 '+s+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(title).width>790 && s>38){ s-=3; g.font='800 '+s+'px ui-sans-serif, Helvetica, Arial'; }
  g.fillText(title, 56, 122);
  g.fillStyle='#4A535D'; g.font='400 34px ui-sans-serif, Helvetica, Arial';
  /* four lines of 790 fit between the title and the footer */
  /* on the alphabetic baseline: 'top' is measured from each line's own glyphs
     in some engines, which made the spacing jump around the letter й */
  g.textBaseline='alphabetic';
  wrapText(g, lines, 790, 4).forEach((l,i)=> g.fillText(l, 56, 280+i*45));
  g.textBaseline='top';
  g.fillStyle='#9DB0C2'; g.font='700 26px ui-sans-serif, Helvetica, Arial';
  g.fillText(tr('pressE'), 56, 470);
  return tex(c);
}
function screenTexture(title, rows, accentHex){
  const c=cvs(512,320), g=c.getContext('2d');
  g.fillStyle='#282C34'; g.fillRect(0,0,512,320);
  g.textAlign='left'; g.textBaseline='top';
  g.fillStyle='#FFFBFB'; g.font='700 40px ui-sans-serif, Helvetica, Arial';
  g.fillText(title, 34, 46);
  g.font='400 27px ui-monospace, Menlo, monospace'; g.fillStyle='#B0BED1';
  rows.forEach((r,i)=> g.fillText(r, 34, 124+i*42));
  return tex(c);
}
function tagTexture(text, accentHex){
  const c=cvs(512,128), g=c.getContext('2d');
  g.fillStyle='#FFFBFB'; g.fillRect(0,0,512,128);
  g.strokeStyle='#39404A'; g.lineWidth=7; g.strokeRect(4,4,504,120);
  g.fillStyle='#282C34'; g.textAlign='center'; g.textBaseline='middle';
  let fs=52; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(text).width>452 && fs>22){ fs-=2; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial'; }
  g.fillText(text, 256, 76);
  return tex(c);
}
function boardTexture(lines, accentHex){
  const W=640,H=400, c=cvs(W,H), g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,H);
  grd.addColorStop(0,'#FFFDF8'); grd.addColorStop(1,'#F2EDE2');
  g.fillStyle=grd; g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(40,44,52,0.16)'; g.lineWidth=2; g.strokeRect(21,26,W-42,H-52);
  g.textAlign='center'; g.textBaseline='middle';
  const n=lines.length, subs=n-1;
  // title size first, so the whole block can be laid out around it
  let fs=62;
  g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(lines[0]||'').width>W-96 && fs>18){ fs-=1; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial'; }
  const RULE_GAP=18, RULE_H=5, SUB_GAP=40, SUB_STEP=46;
  const blockH = fs + (subs? RULE_GAP+RULE_H+SUB_GAP+(subs-1)*SUB_STEP : RULE_GAP+RULE_H);
  let y = H/2 - blockH/2 + fs/2;
  g.letterSpacing='1px'; g.fillStyle='#22252B';
  g.fillText(lines[0]||'', W/2, y);
  g.letterSpacing='0px';
  const ruleY = y + fs/2 + RULE_GAP;
  let sy = ruleY + RULE_H + SUB_GAP;
  for(let i=1;i<n;i++){
    let ss=34;
    g.fillStyle='#3D444E'; g.font='600 '+ss+'px ui-sans-serif, Helvetica, Arial';
    while(g.measureText(lines[i]).width>W-96 && ss>14){ ss-=1; g.font='600 '+ss+'px ui-sans-serif, Helvetica, Arial'; }
    g.fillText(lines[i], W/2, sy);
    sy+=SUB_STEP;
  }
  return tex(c);
}
