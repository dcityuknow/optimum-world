/* ------------------------------ DIALOGUE ------------------------------
   A node graph. Each node has a speaker, a line, and a set of replies. Text is
   typed out, replies fade in after it finishes, and the whole panel takes over
   input while it is open. */
let DLG=null, dlgTyping=null, dlgFrame=0, PORTRAIT={};

function portraitURL(look){
  const k=look.id||look.nick||JSON.stringify(look).slice(0,40);
  if(PORTRAIT[k]) return PORTRAIT[k];
  const src=faceTex(look).image;
  const S=208, c=cvs(S,S), g=c.getContext('2d');
  g.fillStyle='#DFE5EB'; g.fillRect(0,0,S,S);
  g.imageSmoothingEnabled=false;
  g.drawImage(src,0,0,S,S);
  return (PORTRAIT[k]=c.toDataURL('image/png'));
}
function openDialog(nodeId){
  keys={}; running=false;          // drop anything held before movement is frozen
  DLG={node:null};
  $('dlg').classList.add('on');
  freeCursor();
  showNode(nodeId);
}
function closeDialog(){
  if(dlgTyping){ clearInterval(dlgTyping); dlgTyping=null; }
  DLG=null;
  $('dlg').classList.remove('on');
  $('dChoices').innerHTML='';
}
function showNode(id){
  const n=NODES[id];
  if(!n){ closeDialog(); return; }
  DLG.node=id;
  const sp=n.speaker();
  $('dPic').src=portraitURL(sp.look);
  $('dName').textContent=sp.name;
  $('dRole').textContent=sp.role;
  $('dRole').style.background=sp.colour||'var(--lavender)';
  $('dRing').style.borderColor=sp.colour||'var(--lavender)';
  if(n.enter) n.enter();
  const full=n.line();
  const el=$('dText'); el.textContent='';
  $('dChoices').innerHTML='';
  if(dlgTyping) clearInterval(dlgTyping);
  /* Counting interval ticks assumes the timer fires 60 times a second. On a busy
     frame it does not and the line crawls, so drive it off the wall clock. */
  const CPS=58, t0=performance.now();
  let last=0, typedAt=0;
  /* Settled text sits in a text node, the freshly typed letters fade in on
     their own, and a caret rides along at the end. */
  const write=(count,caret)=>{
    el.textContent='';
    const done=Math.max(0,count-6);
    el.appendChild(document.createTextNode(full.slice(0,done)));
    for(let i=done;i<count;i++){
      const b=document.createElement('b');
      b.style.animationDelay=((i-done)*0.012)+'s';
      b.textContent=full[i];
      el.appendChild(b);
    }
    if(caret){ const c=document.createElement('span'); c.id='dCaret'; el.appendChild(c); }
  };
  const finish=()=>{
    if(dlgTyping){ clearInterval(dlgTyping); dlgTyping=null; }
    el.textContent=full; renderChoices(n);
  };
  const tick=()=>{
    const shown=Math.min(full.length, Math.floor((performance.now()-t0)/1000*CPS));
    if(shown!==last){
      write(shown,true); last=shown;
      /* one tick every few letters, not one per letter, or it buzzes */
      if(shown-typedAt>=3){ typedAt=shown; playSfx('type',0.26,0.94+Math.random()*0.14); }
    }
    if(shown>=full.length) finish();
  };
  dlgTyping=setInterval(tick, 16);
  write(0,true);
  tick();
  el.onclick=()=>{ if(dlgTyping) finish(); };
}
function renderChoices(n){
  const box=$('dChoices'); box.innerHTML='';
  n.replies().forEach((r,i)=>{
    const b=document.createElement('button');
    b.className='dch'+(r.key?' key':'');
    b.style.animationDelay=(i*0.07)+'s';
    b.innerHTML=r.sub? ('<span>'+r.t+'</span><small>'+r.sub+'</small>') : r.t;
    b.addEventListener('click',()=>{
      blip(523,0.07,'sine',0.05);
      if(r.act) r.act();
      if(r.go) showNode(r.go); else closeDialog();
    });
    box.appendChild(b);
  });
}
/* who is speaking */
function spkCrowd(id){
  return ()=>{
    const c=CROWD.find(x=>x.id===id)||CROWD[0];
    return {look:c, name:c.nick, role:tr(c.role==='mod'?'roleMod':'roleMum'),
            colour:c.role==='mod'? ROLE.mod.c : ROLE.mum.c};
  };
}
function spkTeam(id){
  return ()=>{
    const d=TEAM.find(x=>x.id===id)||TEAM[0];
    return {look:SKINS[id], name:d.name, role:d.role||'Optimum', colour:'#B87CFF'};
  };
}
/* baised speaks for himself: he is not in CROWD and not on the team */
const spkBaised=()=>({look:SKINS.baised, name:'baised', role:tr('baiRole'), colour:'#7FD3A0'});
const D=(k)=>tr(k);
const NODES={
  /* ---------- baised, on the pier ---------- */
  bai_hello:{
    speaker:spkBaised, line:()=>D('bai1'),
    replies:()=>[
      {t:D('rWhatBites'), go:'bai_ask', key:1},
      {t:D('rWho'), go:'bai_about'},
      {t:D('rBye')}
    ]},
  bai_about:{
    speaker:spkBaised, line:()=>D('baiAbout'),
    replies:()=>[{t:D('rBack'), go:'bai_hello', key:1}]},
  bai_ask:{
    speaker:spkBaised, line:()=>D('bai2'),
    replies:()=>[{t:D('rRod'), go:'bai_give', key:1},{t:D('rBye')}]},
  bai_give:{
    speaker:spkBaised, line:()=>D('bai3'),
    enter:()=>{ if(giveItem('rod')) equip('rod'); if(Q.fish===0){ Q.fish=1; saveQuests(); } },
    replies:()=>[{t:D('rBye'), key:1}]},
  bai_waiting:{
    speaker:spkBaised, line:()=>D('baiWait'),
    enter:()=>{ if(!hasItem('rod')) giveItem('rod'); },
    replies:()=>[{t:D('rBye'), key:1}]},
  bai_turnin:{
    speaker:spkBaised, line:()=>D('baiTurn'),
    /* he takes the fish, and the chain is closed for good */
    enter:()=>{
      if(hasItem('golden')) takeItem('golden');
      if(hasItem('rod')) takeItem('rod');          // his spare, and he wants it back
      if(Q.fish<3){ Q.fish=3; saveQuests(); }
      /* the cap comes off his head and onto yours */
      capOffBaised(); applyWear();
    },
    replies:()=>[{t:D('rBye'), key:1, act:()=>{
      $('doneT').textContent=tr('fishFinT');
      $('doneB').textContent=tr('fishFinB');
      $('done').style.display='flex'; freeCursor(); questCue();
    }}]},
  bai_done:{
    speaker:spkBaised, line:()=>D('baiDone'),
    replies:()=>[{t:D('rWho'), go:'bai_about'},{t:D('rBye'), key:1}]},
  /* ---------- samurai.itan ---------- */
  sam_hello:{
    speaker:spkCrowd('katana'), line:()=>D('sam1'),
    replies:()=>[
      {t:D('rWhat'), go:'sam_ask', key:1},
      {t:D('rAbout'), go:'sam_about'},
      {t:D('rBye')}
    ]},
  sam_about:{
    speaker:spkCrowd('katana'), line:()=>D('samAbout'),
    replies:()=>[{t:D('rBack'), go:'sam_hello', key:1}]},
  sam_ask:{
    speaker:spkCrowd('katana'), line:()=>D('sam2'),
    replies:()=>[
      {t:D('rYes'), go:'sam_go', key:1, act:()=>{ Q.katana=1; saveQuests(); }},
      {t:D('rNoTell'), go:'sam_about'},
      {t:D('rNo')}
    ]},
  sam_go:{
    speaker:spkCrowd('katana'), line:()=>D('sam3'),
    replies:()=>[{t:D('rOk'), key:1}]},
  sam_waiting:{
    speaker:spkCrowd('katana'), line:()=>D('samWait'),
    replies:()=>[{t:D('rOk'), key:1}]},
  sam_give:{
    speaker:spkCrowd('katana'), line:()=>D('samThanks'),
    enter:()=>{ takeItem('katana'); Q.katana=2; saveQuests();
                if(samuraiBlade) samuraiBlade.visible=true;
                blip(659,0.16,'sine',0.12); setTimeout(()=>blip(880,0.35,'sine',0.12),170); },
    replies:()=>[{t:D('rWhatNext'), go:'sam_refer', key:1}]},
  sam_refer:{
    speaker:spkCrowd('katana'), line:()=>D('samRefer'),
    replies:()=>[{t:D('rOk'), key:1}]},
  sam_done:{
    speaker:spkCrowd('katana'), line:()=>D('samDone'),
    replies:()=>[{t:D('rBye'), key:1}]},

  /* ---------- Pegasus, the explorer quest ---------- */
  vs_hello:{
    speaker:spkCrowd('fox'), line:()=>D('peg1'),
    replies:()=>[
      {t:D('rWhat'), go:'vs_ask', key:1},
      {t:D('rAbout'), go:'vs_about'},
      {t:D('rBye')}
    ]},
  vs_about:{
    speaker:spkCrowd('fox'), line:()=>D('pegAbout'),
    replies:()=>[{t:D('rBack'), go:'vs_hello', key:1}]},
  vs_ask:{
    speaker:spkCrowd('fox'), line:()=>D('peg2'),
    replies:()=>[
      {t:D('rYes'), go:'vs_go', key:1, act:()=>{ Q.explore=1; Q.doors=0; saveQuests(); }},
      {t:D('rNoTell'), go:'vs_about'},
      {t:D('rNo')}
    ]},
  vs_go:{
    speaker:spkCrowd('fox'), line:()=>D('peg3'),
    replies:()=>[{t:D('rOk'), key:1}]},
  vs_progress:{
    speaker:spkCrowd('fox'), line:()=>D('pegProg').replace('{n}', coreCount()).replace('{t}', 15),
    replies:()=>[{t:D('rOk'), key:1}]},
  vs_done:{
    speaker:spkCrowd('fox'), line:()=>D('pegDone'),
    replies:()=>[{t:D('rOk'), key:1}]},

  /* ---------- Jeffrey at the bar ---------- */
  jeff_hello:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeff1'),
    replies:()=>[
      {t:D('rWhat'), go:'jeff_ask', key:1},
      {t:D('rBye')}
    ]},
  jeff_ask:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeff3'),
    replies:()=>[
      {t:D('rYes'), go:'jeff_go', key:1,
       act:()=>{ Q.dig=1; saveQuests(); giveItem('map'); giveItem('shovel'); }},
      {t:D('rNo')}
    ]},
  jeff_go:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeff4'),
    replies:()=>[{t:D('rOk'), key:1, act:()=>{ equip('map'); }}]},
  jeff_more:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeffMore'),
    replies:()=>[{t:D('rOk'), key:1}]},
  /* the hand in: he takes the fragment and the beer is the reward */
  jeff_turnin:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeffGot'),
    replies:()=>[{t:D('rGive'), go:'jeff_reward', key:1,
      act:()=>{ takeItem('fragment'); takeItem('map');
                /* MiReTu lent you that shovel too, if his dig is still on */
                if(!(Q.leg>=1 && Q.leg<=4)) takeItem('shovel');
                Q.dig=3; saveQuests();
                showPlinth(true);
                giveItem('beer'); equip('beer');
                blip(523,0.16,'sine',0.12);
                setTimeout(()=>blip(659,0.16,'sine',0.12),150);
                setTimeout(()=>blip(880,0.34,'sine',0.12),300); }}]},
  jeff_reward:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeffReward'),
    replies:()=>[{t:D('rCheers'), go:'jeff_outro', key:1}]},
  jeff_outro:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeffOutro'),
    replies:()=>[{t:D('rOk'), go:'jeff_pier', key:1}]},
  /* the bridge to the pier: said once when the fragments are in, and again
     any time you ask him for somewhere quiet */
  jeff_pier:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeffPier'),
    replies:()=>[{t:D('rOk'), key:1}]},
  jeff_done:{
    speaker:spkTeam('jeffrey'), line:()=>D('jeffDone'),
    replies:()=>[
      {t:D('rBeerYes'), key:1, act:()=>{ if(!hasItem('beer')){ giveItem('beer'); equip('beer'); } }},
      ...(Q.fish<3 ? [{t:D('rQuiet'), go:'jeff_pier'}] : []),
      {t:D('rBye')}
    ]}
};
function coreCount(){
  const need=CITY.map(d=>d.id+':').concat(TEAM.map(d=>d.id+':'));
  let n=0; need.forEach(k=>{ if(visited.has(k)) n++; });
  return n;
}
