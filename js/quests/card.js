/* ------------------------------ THE CARD ------------------------------ */
function loadImg(src){ return new Promise(r=>{ if(!src){ r(null); return; } const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; }); }
function paperTile(g,x,y,w,h,ch,rot,seed){
  const r=seedRnd(seed);
  g.save(); g.translate(x+w/2,y+h/2); g.rotate(rot);
  const j=()=>(r()-0.5)*w*0.05, pts=[];
  const n=9;
  for(let i=0;i<=n;i++) pts.push([-w/2+w*i/n+j()*0.3, -h/2+j()]);
  for(let i=0;i<=n;i++) pts.push([w/2+j(), -h/2+h*i/n+j()*0.3]);
  for(let i=n;i>=0;i--) pts.push([-w/2+w*i/n+j()*0.3, h/2+j()]);
  for(let i=n;i>=0;i--) pts.push([-w/2+j(), -h/2+h*i/n+j()*0.3]);
  g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=26; g.shadowOffsetY=10;
  g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); pts.forEach(p=>g.lineTo(p[0],p[1])); g.closePath();
  g.fillStyle='#F3F1EC'; g.fill();
  g.shadowColor='transparent';
  g.fillStyle='#131417'; g.textAlign='center'; g.textBaseline='middle';
  g.font='900 '+Math.round(h*0.78)+'px Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif';
  g.fillText(ch,0,h*0.04);
  g.restore();
}
async function drawCqCard(){
  const W=1600, H=900, c=cvs(W,H), g=c.getContext('2d');
  g.fillStyle='#24272C'; g.fillRect(0,0,W,H);
  /* soft chrome blobs, the way the invitation looked */
  const blob=(x,y,r,a)=>{
    const gr=g.createRadialGradient(x-r*0.32,y-r*0.36,r*0.08,x,y,r);
    gr.addColorStop(0,'rgba(226,230,236,'+a+')'); gr.addColorStop(0.5,'rgba(128,134,142,'+(a*0.75)+')');
    gr.addColorStop(1,'rgba(36,39,44,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,6.283); g.fill();
  };
  [[110,130,170,.55],[1500,140,130,.5],[1400,800,210,.5],[250,830,150,.45],[860,40,80,.3],[1560,520,100,.4],[40,500,90,.35]]
    .forEach(b=>blob(b[0],b[1],b[2],b[3]));
  g.fillStyle='rgba(255,255,255,.06)'; g.font='800 130px ui-sans-serif, Helvetica, Arial';
  g.textAlign='center'; g.textBaseline='middle';
  [[760,170],[70,540],[1535,545],[790,570],[640,830]].forEach(p=>g.fillText('?',p[0],p[1]));
  /* header */
  let hx=110; const hy=112;
  if(LOGOIMG && LOGOIMG.complete && LOGOIMG.naturalWidth){
    const lh=64, lw=Math.round(lh*(LOGOIMG.naturalWidth/LOGOIMG.naturalHeight));
    g.drawImage(LOGOIMG,hx,hy-lh/2,lw,lh); hx+=lw+22;
  } else { g.fillStyle='#FFFBFB'; g.font='800 64px ui-sans-serif, Helvetica, Arial'; g.textAlign='left'; g.fillText('optimum',hx,hy); hx+=g.measureText('optimum').width+22; }
  g.fillStyle='#FFFBFB'; g.textAlign='left'; g.font='800 62px ui-sans-serif, Helvetica, Arial';
  g.fillText('World',hx,hy+2);
  g.fillStyle='rgba(211,219,226,.75)'; g.font='700 26px ui-sans-serif, Helvetica, Arial';
  g.textAlign='right'; g.fillText('C O M M U N I T Y   Q U E S T', W-110, hy+2);
  /* the code */
  const tw=158, th=196, gap=22, tx0=(W-(7*tw+6*gap))/2, ty=250;
  for(let i=0;i<7;i++) paperTile(g, tx0+i*(tw+gap), ty, tw, th, CQ_WORD[i], (i%2?1:-1)*(0.02+((i*37)%5)*0.008), 300+i*13);
  /* who cracked it */
  const nick=((profile.nick||'').trim()||'Anonymous');
  const av=await loadImg(profile.photo);
  const by=620;
  g.textAlign='left'; g.textBaseline='middle';
  let bx=110;
  if(av){
    const s=150;
    g.save(); g.beginPath(); g.arc(bx+s/2,by+s/2-10,s/2,0,6.283); g.clip();
    const m=Math.min(av.width,av.height);
    g.drawImage(av,(av.width-m)/2,(av.height-m)/2,m,m,bx,by-10,s,s); g.restore();
    bx+=s+34;
  }
  g.fillStyle='rgba(211,219,226,.75)'; g.font='700 26px ui-sans-serif, Helvetica, Arial';
  g.fillText('C O D E   C R A C K E D   B Y', bx, by+8);
  g.fillStyle='#FFFBFB';
  let fs=76; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(nick).width>820 && fs>40){ fs-=4; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial'; }
  g.fillText(nick, bx, by+74);
  const hn=(profile.x||'').trim();
  let meta=hn? '@'+hn : '';
  try{ const me=COMMUNITY.find(d=>d.mine); if(me && me.guest) meta+=(meta?'   ':'')+'Resident #'+residentNo(me.guest); }catch(e){}
  if(meta){ g.fillStyle='#9FE7B8'; g.font='700 30px ui-sans-serif, Helvetica, Arial'; g.fillText(meta, bx, by+132); }
  /* credits and the date */
  g.textAlign='right'; g.fillStyle='rgba(211,219,226,.7)'; g.font='600 26px ui-sans-serif, Helvetica, Arial';
  g.fillText('quest by @baisedit   idea by @umpia_eth', W-110, by+74);
  g.fillText(new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}), W-110, by+132);
  return c.toDataURL('image/png');
}
async function refreshCardPreview(){
  try{
    CQCARD=await drawCqCard();
    if(vaultCardM){ vaultCardM.map=photoTex(CQCARD); vaultCardM.needsUpdate=true; }
  }catch(e){}
}
/* the moment you step down into the cellar the quest is done */
function cqSuccess(){
  if(Q.cq!==5) return;
  Q.cq=6; saveQuests(); updateTracker();
  if(!playSfx('found',0.85)) blip(784,0.2,'sine',0.12);
  keys={}; running=false;
  questIntro({pic:portraitURL(SKINS.umpia), k:tr('cqWinK'), t:tr('cqDoneT'), s:tr('cqDoneB'),
    tiles:CQ_WORD, after:()=>cqFinish()});
}
async function cqFinish(){
  if(!CQCARD) await refreshCardPreview();
  if(!CQCARD) return;
  $('shotImg').src=CQCARD;
  $('shot').dataset.card='1';
  $('shotX').style.display='inline-block';
  const h=document.querySelector('#shot .hint'); if(h) h.textContent=tr('cqCardHint');
  $('shot').style.display='flex'; freeCursor();
}
function postCqOnX(){
  let url='';
  try{ if(/^https?:/.test(location.protocol)) url=location.origin+location.pathname; }catch(e){}
  const text=tr('cqTweet')+(url?' '+url:'');
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank','noopener');
}
