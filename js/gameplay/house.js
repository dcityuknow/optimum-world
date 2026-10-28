/* ------------------------------ YOUR HOUSE ------------------------------ */
let houseRefs=null;
function refreshHouse(){
  noteHouseRule();
  if(!houseRefs){
    /* The card was filled in after the world was built. The street is laid
       out again so you take the front plot now. Once per identity: if your
       house still is not up after that, rebuilding again will not help. */
    if(scene && profileComplete() && !rebuilding && streetFor!==meKey()){
      streetFor=meKey(); rebuildStreet();
    }
    return;
  }
  const named=(profile.nick||'').trim();
  const r=roleOf(profile.role), nick=named||tr('claimName');
  const sub=named?roleLabel(profile.role):tr('claimSub');
  const bio=(profile.bio||'').trim()||tr('believer');
  houseRefs.sign.material.map=signTexture(nick,sub,hx(r.c));
  houseRefs.sign.material.needsUpdate=true;
  houseRefs.sign2.material.map=houseRefs.sign.material.map;
  houseRefs.sign2.material.needsUpdate=true;
  houseRefs.plaque.material.map=plaqueTexture(sub,nick,[bio,profile.x?('@'+profile.x):''],hx(r.c));
  houseRefs.plaque.material.needsUpdate=true;
  houseRefs.accents.forEach(m=>m.material.color.setHex(r.c));
  const sp=houseRefs.spot;
  sp.data.name=nick; sp.data.sub=sub; sp.data.bio=bio; sp.accent=r.c;
}
