const CITY = [
 { id:'rlnc', key:'rlnc', style:'drum', name:'RLNC Lab', sub:'The invention',
   links:[['How it works','https://www.getoptimum.xyz/product#rlnc']] },
 { id:'mump2p', key:'mump2p', style:'tower', name:'mump2p Station', sub:'The product',
   links:[['Docs','https://docs.getoptimum.xyz/docs/learn/overview/intro'],['Product','https://www.getoptimum.xyz/product#mump2p']] },
 { id:'speed', key:'speed', style:'blade', name:'Speed Tower', sub:'The numbers',
   links:[['Product page','https://www.getoptimum.xyz/product']] },
 { id:'integration', key:'integration', style:'arch', name:'Integration Hall', sub:'How it fits',
   links:[['FAQ','https://www.getoptimum.xyz/'],['Docs','https://docs.getoptimum.xyz/docs/learn/overview/intro']] },
 { id:'validators', key:'validators', style:'stack', name:'Validator Depot', sub:'Who is testing',
   links:[['Validator waitlist','https://www.getoptimum.xyz/ethereum-validator-waitlist']] },
 { id:'timeline', key:'timeline', style:'zig', name:'Timeline Archive', sub:'From lab to mainnet',
   links:[['Our story','https://www.getoptimum.xyz/team#timeline'],['Blog','https://www.getoptimum.xyz/blog']] }
];
const TEAM = [
 { id:'muriel', key:'muriel', style:'villa', name:'Muriel Medard', sub:'Co-Founder, CEO', shirt:0xB87CFF, skin:0xE8C9A8,
   links:[['X','https://x.com/MurielMedard'],['LinkedIn','https://www.linkedin.com/in/murielmedard/']] },
 { id:'kishori', key:'kishori', style:'pod', name:'Kishori Konwar', sub:'Co-Founder', shirt:0x51B1FE, skin:0xC29168,
   links:[['LinkedIn','https://linkedin.com/in/kishorikonwar']] },
 { id:'kent', key:'kent', style:'villa', name:'Kent Lin', sub:'Co-Founder', shirt:0x33363C, skin:0xE0BA92,
   links:[['X','https://x.com/kentlinyy'],['LinkedIn','https://linkedin.com/in/kentyeyanglin']] },
 { id:'lewej', key:'lewej', style:'pod', name:'Lewej Whitelow', sub:'Senior Technical Program Manager', shirt:0x2F6DB5, skin:0x6B4A34,
   links:[['LinkedIn','https://www.linkedin.com/in/lewej/'],['Team page','https://www.getoptimum.xyz/team']] },
 { id:'eli', key:'eli', style:'villa', name:'Eli Laipson', sub:'Chief Marketing Officer',
   links:[['X','https://x.com/EliLaipson'],['Optimum','https://x.com/get_optimum']] },
 { id:'jeffrey', key:'jeffrey', style:'pod', name:'Jeffrey Elliott', sub:'Community Lead',
   links:[['X','https://x.com/blockchainjeff'],['Optimum','https://x.com/get_optimum']] },
 { id:'chandler', key:'chandler', style:'villa', name:'Chandler Otterbein', sub:'Strategy and Operations',
   links:[['X','https://x.com/ChandlerOtterbe'],['Optimum','https://x.com/get_optimum']] },
 { id:'nancy', key:'nancy', style:'villa', name:'Nancy Lynch', sub:'Advisor', shirt:0x64E27F, skin:0xEBD3B6,
   links:[['Team page','https://www.getoptimum.xyz/team']] },
 { id:'sriram', key:'sriram', style:'pod', name:'Sriram Viswanath', sub:'Advisor', shirt:0xFEA158, skin:0xC08B5E,
   links:[['Team page','https://www.getoptimum.xyz/team']] }
];
const COMMUNITY = [];
/* Nicknames are typed by hand, so the same person arrives as samurai.itan,
   Samurai_Itan or @SAMURAI ITAN. Strip everything but letters and digits so a
   real mumbassador or team member never gets a second, empty house. */
/* Latin only used to be enough here. It is not: a Cyrillic nick was stripped
   down to an empty string, every such nick then compared equal to every
   other one, and the second person to register with one silently replaced
   the first instead of getting a house. Letters and digits of any script
   are kept now; only spacing and punctuation are dropped. */
function idKey(s){
  const t=(s||'').toString().toLowerCase();
  try{ return t.replace(/[^\p{L}\p{N}]/gu,''); }
  catch(e){ return t.replace(/[\s\-_.,:;!?'"()\[\]{}\/\\@#*+=|~`^$%&<>]/g,''); }
}
function handleKey(s){
  let h=(s||'').toString().trim().toLowerCase();
  h=h.replace(/^https?:\/\//,'').replace(/^(www\.)?(x|twitter)\.com\//,'');
  h=h.split(/[/?#]/)[0];
  return idKey(h);
}
let HOUSED=null;
function housedKeys(){
  if(HOUSED) return HOUSED;
  HOUSED=new Set();
  const add=k=>{ if(k && k.length>2) HOUSED.add(k); };
  CROWD.forEach(c=>{ add(idKey(c.nick)); add(handleKey(c.x)); });
  TEAM.forEach(d=>{
    add(idKey(d.name));
    (d.links||[]).forEach(l=>{ if(/x\.com/.test(l[1])) add(handleKey(l[1])); });
  });
  HOUSED.delete(idKey('get_optimum'));   // the brand account is not a resident
  return HOUSED;
}
function alreadyHoused(v){
  const set=housedKeys();
  return set.has(idKey(v.nick)) || set.has(handleKey(v.x));
}
/* the roster entry belonging to a resident who already has a house, so a real
   mumbassador moves into his own house instead of getting an empty second one */
function liveFor(c){
  for(let i=0;i<ROSTER.length;i++){
    const v=ROSTER[i];
    const nk=idKey(v.nick), xk=handleKey(v.x);
    if((nk && (nk===idKey(c.nick) || nk===handleKey(c.x))) ||
       (xk && (xk===handleKey(c.x) || xk===idKey(c.nick)))) return v;
  }
  return null;
}
/* Guests come first on the street, the twelve residents sit behind them. New
   people join in the order they registered, so the row stays put between
   loads instead of reshuffling every time somebody edits their profile. */
const MAXHOUSES=50;
let RES0=12;                 // first plot of the residents' block
/* the lowest plot nobody lives on: first the free ground before the residents,
   and only if that is all taken, past the end of their block */
function nextFreeSlot(){
  return COMMUNITY.reduce((m,d)=>Math.max(m, d.slot!==undefined?d.slot+1:0), 0);
}
/* The row, from the plaza outward: whoever registered most recently stands
   first, then everyone older, then the residents. The order is read from
   `joined` alone, which is written once and never changes, so coming back
   to the game never moves your house: only a genuinely new registration
   takes the front plot, on the next load, and nudges the rest one along.
   A record with no date at all predates the field, so it counts as the
   oldest and goes to the back of the players; ties are broken by name. */
/* The resident number is the order people moved in: the first ever to
   register is #1 and every newcomer gets the next number. It used to be the
   house's place in the row, and the row runs newest first, so the oldest
   resident was getting the biggest number. */
function residentNo(v){
  const all=COMMUNITY.filter(d=>d.guest).map(d=>d.guest);
  all.sort((a,b)=>{ const d=seatOf(a)-seatOf(b); if(d) return d;
    const ka=idKey(a.nick), kb=idKey(b.nick); return ka<kb?-1:ka>kb?1:0; });
  const i=all.indexOf(v); return i<0 ? all.length+1 : i+1;
}
function seatOf(v){
  const j=Number(v&&v.joined);
  return (isFinite(j) && j>0) ? j : 0;
}
function seatSort(a,b){
  const ja=seatOf(a), jb=seatOf(b);
  if(ja!==jb) return jb-ja;                       // newest first
  const ka=idKey(a.nick)||handleKey(a.x), kb=idKey(b.nick)||handleKey(b.x);
  return ka<kb ? -1 : ka>kb ? 1 : 0;
}
function buildCommunityList(){
  COMMUNITY.length=0;
  const guests=[];
  for(let i=0;i<ROSTER.length;i++){
    const v=ROSTER[i];
    if(isMe(v)) continue;                // the local card below is the newer copy
    if(!fullRecord(v)) continue;         // an empty card gets no plot
    if(alreadyHoused(v)) continue;       // he walks these streets already
    guests.push(v);
  }
  if(profileComplete()) guests.push(meRecord());   // you queue by joining date, like anyone
  guests.sort(seatSort);
  const room=MAXHOUSES-CROWD.length;
  const nG=Math.min(guests.length, room);
  RES0=nG;                                    // residents follow straight on, no gap
  for(let i=0;i<nG;i++){ const d=guestEntry(guests[i]); d.slot=i; COMMUNITY.push(d); }
  for(let i=0;i<CROWD.length;i++){
    const c=CROWD[i];
    COMMUNITY.push({id:'res', res:c, live:liveFor(c), key:'resident', style:'cube',
      name:c.nick, sub:(c.role==='mod'?'Moderator':'Mumbassador'),
      links:[['X',c.x]], slot:RES0+i});
  }
}
/* Your own record, however it is spelled. The nick is matched the same way
   every other identity in the file is, and the X handle is matched too, so
   renaming yourself never earns you a second house. */
function isMe(v){
  if(!v) return false;
  const nk=idKey(profile.nick), xk=handleKey(profile.x);
  if(nk && (idKey(v.nick)===nk || handleKey(v.x)===nk)) return true;
  if(xk && (handleKey(v.x)===xk || idKey(v.nick)===xk)) return true;
  return false;
}
/* A house on the Community street is earned by a full record: a name, a line
   about you, an X handle and a picture. Anything less stays off the street. */
function fullRecord(v){
  if(!v) return false;
  const t=x=>(x||'').toString().trim();
  return !!t(v.nick) && !placeholderNick(v.nick) && !!t(v.bio) && !!t(v.x) && !!t(v.photo);
}
function profileComplete(){ return fullRecord(profile); }
function noteHouseRule(){
  const n=$('s4note'); if(!n) return;
  const ok=profileComplete();
  n.textContent = ok ? tr('houseReady') : '';
  n.className = ok ? 'obnote ok' : 'obnote';
}

/* Somebody who never typed a name. The record stays in the database, it just
   does not earn a house on the street. */
function placeholderNick(n){
  return ['anon','anonymous','anonim','anonym','guest','unnamed','noname'].indexOf(idKey(n))>=0;
}
function guestEntry(v){
  const d={id:'guest', guest:v, key:'guest', style:'cube',
    name:v.nick, sub:roleLabel(v.role), links:v.x?[['X','https://x.com/'+v.x]]:[]};
  if(v.__me) d.mine=1;
  return d;
}
/* you, as the street sees you: the local card, flagged so the house it
   raises keeps the live sign and the extra plate */
function meRecord(){
  return {nick:(profile.nick||'').trim(), role:profile.role||'newbie',
    bio:(profile.bio||'').trim(), x:(profile.x||'').trim(),
    photo:profile.photo||'', joined:myJoined(), __me:1};
}
