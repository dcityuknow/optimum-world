/* ------------------------------ MINIMAP ------------------------------ */
let MURIEL_ROOM=null;
let miniN=0;
function drawMini(){
  const c=$('mini'); if(!c) return;
  const g=c.getContext('2d'), S=c.width, R=210, k=(S/2)/R;
  g.clearRect(0,0,S,S);
  g.strokeStyle='#C9CFD6'; g.lineWidth=9; g.lineCap='round';
  g.beginPath(); g.moveTo(S/2,S/2); g.lineTo(S/2,S/2-200*k); g.stroke();
  g.beginPath(); g.moveTo(S/2,S/2); g.lineTo(S/2-200*k,S/2); g.stroke();
  g.beginPath(); g.moveTo(S/2,S/2); g.lineTo(S/2+200*k,S/2); g.stroke();
  for(let i=0;i<mapItems.length;i++){
    const m=mapItems[i];
    g.fillStyle=m.c;
    g.fillRect(S/2+m.x*k-m.w*k/2, S/2+m.z*k-m.d*k/2, Math.max(3,m.w*k), Math.max(3,m.d*k));
  }
  /* where the open quests want you, once you know */
  if((Q.cq===0 && Q.leg>=6) || (Q.cq>=2 && Q.cq<=5)){ g.fillStyle='#B8925A'; g.beginPath(); g.arc(S/2+VAULT.x*k,S/2+VAULT.z*k,6,0,6.283); g.fill(); }
  if((Q.leg===0 && Q.fish>=3) || (Q.leg>=1 && Q.leg<=5)){ g.fillStyle='#4FA82A'; g.beginPath(); g.arc(S/2+BEACH.x*k,S/2+BEACH.z*k,6,0,6.283); g.fill(); }
  g.save();
  g.translate(S/2+player.x*k, S/2+player.z*k);
  g.rotate(-player.yaw);
  g.fillStyle='#282C34';
  g.beginPath(); g.moveTo(0,-11); g.lineTo(7,8); g.lineTo(0,4); g.lineTo(-7,8); g.closePath(); g.fill();
  g.restore();
}
