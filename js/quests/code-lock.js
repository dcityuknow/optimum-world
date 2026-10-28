/* ------------------------------ THE CODE ------------------------------ */
let codeSel=[];
function openCode(){
  CODE_OPEN=true; keys={}; running=false; freeCursor();
  $('codeT').textContent=tr('codeT'); $('codeS').textContent=tr('codeS');
  $('codeClr').textContent=tr('codeClear'); $('codeX').textContent=tr('close');
  $('codeMsg').textContent='';
  $('codeP').style.display='flex';
  codeFill();
}
function codeFill(){
  codeSel=[];
  let idx=[0,1,2,3,4,5,6];
  do{ for(let i=idx.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=idx[i]; idx[i]=idx[j]; idx[j]=t; } }
  while(idx.map(i=>CQ_WORD[i]).join('')===CQ_WORD);
  const box=$('codeTiles'); box.innerHTML='';
  idx.forEach(i=>{
    const b=document.createElement('button');
    b.className='pt'; b.textContent=CQ_WORD[i];
    b.style.transform='rotate('+((Math.random()-0.5)*7).toFixed(1)+'deg)';
    b.addEventListener('click',()=>{
      if(b.classList.contains('used') || codeSel.length>=7) return;
      b.classList.add('used'); codeSel.push(i); codeSlots();
      if(!playSfx('ui',0.5,1.1)) blip(660,0.05,'sine',0.05);
      if(codeSel.length===7) setTimeout(codeCheck,180);
    });
    box.appendChild(b);
  });
  codeSlots();
}
function codeSlots(){
  const s=$('codeSlots'); s.innerHTML='';
  for(let k=0;k<7;k++){
    const d=document.createElement('span');
    d.className='slot'+(k<codeSel.length?' on':'');
    d.textContent=k<codeSel.length?CQ_WORD[codeSel[k]]:'';
    s.appendChild(d);
  }
}
function codeCheck(){
  const w=codeSel.map(i=>CQ_WORD[i]).join('');
  if(w===CQ_WORD){
    if(cueOK() && !playSfx('quest',0.7)) blip(660,0.16,'sine',0.1);
    closeCode();
    Q.cq=5; saveQuests(); openVault(false);
    setTimeout(()=>openDialog('um_open'),350);
    updateTracker();
  } else {
    const p=$('codeP'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
    $('codeMsg').textContent=tr('codeWrong');
    blip(180,0.18,'sine',0.08);
    setTimeout(codeFill,900);
  }
}
function closeCode(){ CODE_OPEN=false; $('codeP').style.display='none'; }
