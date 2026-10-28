/* ------------------------------ GALLERY PLOTS ------------------------------ */
const plotData={}, plotRefs={};
function artTexture(rec){
  const c=cvs(1024,720), g=c.getContext('2d');
  const t=tex(c);
  const draw=img=>{
    g.fillStyle='#EFEDE8'; g.fillRect(0,0,1024,720);
    if(img){
      const k=Math.min(1024/img.width,720/img.height), w=img.width*k, h=img.height*k;
      g.drawImage(img,(1024-w)/2,(720-h)/2,w,h);
    } else {
      g.strokeStyle='#A9B5C2'; g.lineWidth=9; g.setLineDash([28,20]);
      g.strokeRect(30,30,964,660); g.setLineDash([]);
      g.fillStyle='#7C8A99'; g.textAlign='center'; g.textBaseline='middle';
      g.font='800 74px ui-sans-serif, Helvetica, Arial';
      g.fillText('YOUR ART HERE',512,318);
      g.font='400 40px ui-sans-serif, Helvetica, Arial';
      g.fillText('press E and upload a picture',512,398);
    }
    t.needsUpdate=true;
  };
  draw(null);
  if(rec&&rec.img){ const im=new Image(); im.onload=()=>draw(im); im.src=rec.img; }
  return t;
}
function plateTexture(rec,accentHex){
  const c=cvs(640,200), g=c.getContext('2d');
  g.fillStyle='#FFFBFB'; g.fillRect(0,0,640,200);
  g.strokeStyle='#39404A'; g.lineWidth=8; g.strokeRect(4,4,632,192);
  g.textAlign='left'; g.textBaseline='top'; g.fillStyle='#282C34';
  const title=(rec&&rec.title)||'Open wall';
  let fs=62; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(title).width>570&&fs>24){ fs-=2; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial'; }
  g.fillText(title,32,52);
  g.fillStyle='#7C8A99'; g.font='700 34px ui-sans-serif, Helvetica, Arial';
  g.fillText((rec&&rec.author)||'',32,132);
  return tex(c);
}
function applyPlot(i){
  const r=plotRefs[i]; if(!r) return;
  const rec=plotData[i]||{};
  r.art.material.map=artTexture(rec); r.art.material.needsUpdate=true;
  r.plate.material.map=plateTexture(rec,hx(r.acc)); r.plate.material.needsUpdate=true;
}
function savePlot(i){
  try{ store.set('optimum-world:plot:'+i, JSON.stringify(plotData[i]||{})); }catch(e){}
  applyPlot(i);
}
async function loadPlots(){
  for(const k in plotRefs){
    const raw=await store.get('optimum-world:plot:'+k);
    if(raw){ try{ plotData[k]=Object.assign(plotData[k]||{},JSON.parse(raw)); }catch(e){} }
    applyPlot(k);
  }
}
