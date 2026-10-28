/* ------------------------------ THE LEADERBOARD ------------------------------
   One small document per player in its own collection, so reading the top ten
   does not drag fifty portraits along. If that collection is closed to us the
   best time rides along on the resident record instead, and failing both the
   board shows what this device knows. */
function withTimeout(p,ms){ return Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]); }
async function lbLoad(){
  const map={}; let shared=false;
  const add=(nick,x,score)=>{ score=Number(score); if(!nick || !(score>0)) return;
    const k=idKey(nick)||nick; if(!map[k] || map[k].score<score) map[k]={nick:nick, x:x||'', score:score}; };
  if(DB){
    try{
      const s=await withTimeout(DB.collection('bullride').orderBy('score','desc').limit(12).get(),5000);
      s.forEach(d=>{ const v=d.data(); add(v.nick,v.x,v.score); }); shared=true;
    }catch(e){}
    try{ ROSTER.forEach(v=>{ if(v && v.bull){ add(v.nick,v.x,v.bull); shared=true; } }); }catch(e){}
  }
  if(Q.bb>0) add((profile.nick||'').trim()||'anon', profile.x, Q.bb/10);
  const rows=Object.values(map).sort((a,b)=>b.score-a.score).slice(0,10);
  LB_CACHE={rows:rows, shared:shared}; LB_AT=Date.now();
  return rows;
}
async function lbSubmit(score){
  const nick=(profile.nick||'').trim();
  if(!DB || !nick) return;
  const rec={nick:nick.slice(0,18), x:(profile.x||'').slice(0,15), score:Math.round(score*10)/10, t:Date.now()};
  try{ await withTimeout(DB.collection('bullride').doc(docId(nick)).set(rec,{merge:true}),6000); }
  catch(e){
    try{ await withTimeout(DB.collection('residents').doc(docId(nick)).set({bull:rec.score, bullT:rec.t},{merge:true}),6000); }catch(e2){}
  }
  try{ const rows=await lbLoad(); if(RODEO){ RODEO.boardM.map=boardTex(rows); RODEO.boardM.needsUpdate=true; } }catch(e){}
}
let LB_OPEN=false;
async function openBoard(){
  LB_OPEN=true; keys={}; running=false; freeCursor();
  $('lbT').textContent=tr('lbTitle'); $('lbX').textContent=tr('close');
  const L=$('lbL'); L.innerHTML='<p class="lbNote"></p>'; L.firstChild.textContent=tr('lbLoading');
  $('lbP').style.display='flex';
  const rows=await lbLoad();
  if(!LB_OPEN) return;
  L.innerHTML='';
  if(!rows.length){ const p=document.createElement('p'); p.className='lbNote'; p.textContent=tr('lbEmpty'); L.appendChild(p); return; }
  const me=idKey(profile.nick||'');
  rows.forEach((r,i)=>{
    const d=document.createElement('div'); d.className='lbRow'+(idKey(r.nick)===me?' me':'');
    d.innerHTML='<span class="n"></span><span class="nm"></span><span class="sc"></span>';
    d.querySelector('.n').textContent=(i+1);
    d.querySelector('.nm').textContent=r.nick+(idKey(r.nick)===me?'  ('+tr('lbYou')+')':'');
    d.querySelector('.sc').textContent=r.score.toFixed(1)+' s';
    L.appendChild(d);
  });
  if(!LB_CACHE.shared){ const p=document.createElement('p'); p.className='lbNote'; p.textContent=tr('lbLocal'); L.appendChild(p); }
}
function closeBoard(){ LB_OPEN=false; $('lbP').style.display='none'; }
