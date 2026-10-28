/* ------------------------------ BEER ------------------------------
   One mug is worth about 15 seconds of wobble; a second one stacks on top of
   the first but the total is capped so the world stays walkable. */
let DRUNK=0, DRUNKPH=0, drunkFx=null, drunkLast=-1;
function drunkOverlay(){
  if(drunkFx) return drunkFx;
  drunkFx=document.createElement('div');
  drunkFx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;'+
    'transition:opacity .6s ease;background:radial-gradient(ellipse at center,'+
    'rgba(255,190,110,0) 42%,rgba(180,90,30,0.30) 78%,rgba(60,25,0,0.55) 100%)';
  document.body.appendChild(drunkFx);
  return drunkFx;
}
function drink(){
  DRUNK=Math.min(1, DRUNK+0.42);
  DRUNKPH=Math.random()*6.283;
}
/* the canvas filter is the expensive part, so it only changes when the level
   moves by a visible step, not every frame */
function drunkPaint(){
  const step=Math.round(DRUNK*10);
  if(step===drunkLast) return;
  drunkLast=step;
  const d=step/10;
  const fx=drunkOverlay();
  fx.style.opacity=(d*0.7).toFixed(2);
  if(!renderer) return;
  /* a blur on a full screen canvas is the one thing phones cannot afford,
     so touch gets the colour shift and the vignette without it */
  const bl = isTouch ? 0 : d*1.1;
  renderer.domElement.style.filter = d<0.05 ? '' :
    (bl? 'blur('+bl.toFixed(2)+'px) ' : '')+
    'saturate('+(1+d*0.45).toFixed(2)+') contrast('+(1-d*0.10).toFixed(2)+')';
}
function drunkTick(dt){
  if(DRUNK<=0) return;
  DRUNK=Math.max(0, DRUNK-dt*0.028);    // sober in about 15s per mug
  drunkPaint();
}
