// ============================================================================
// SOLDIER: nhân vật lính voxel của game "from0tohero" (Block Arena), đóng gói để dùng trong optimum-world.
// Gộp từ engine/voxel.js (lõi VB) + ui/character.js (11 nhân vật quân phục theo quốc gia). Bọc trong IIFE nên KHÔNG làm
// trùng tên biến toàn cục của game 1. Chỉ lộ ra: window.Soldier = { list, make(k) }.
//   Soldier.make('vn') -> { g, armL, armR, legL, legR }   (mặt nhìn +z, chân chạm y=0, cao ~1.8m, đơn vị mét)
// Mã nhân vật: vn us ru ng bd id in cn ph ua kr. Cần THREE r128 nạp trước. File này chỉ được nạp khi ?visit=1 (xem visit-mode.js).
// ============================================================================
(function(){
// Lõi dựng mô hình bằng khối rubik nhỏ (voxel). Mỗi bộ phận gộp thành 1 mesh nên vẫn nhẹ dù hàng nghìn khối.
// new VB(true) = nhớ lại từng khối (dùng cho bot để vỡ mảnh khi chết). shell=true = chỉ tạo lớp vỏ ngoài, bỏ khối ruột.
// Cách dùng: box(tâm x,y,z, rộng,cao,dài, màu hoặc hàm màu, cỡ khối) · cyl(...) hình trụ · ell(...) hình cầu/elip
// Vật liệu riêng: đèn bán cầu 1.05 + mặt trời .5 + emissive .118 CỐ ĐỊNH theo hướng thế giới (đúng như game gốc), không chịu tone mapping / sương mù / ánh sáng của thế giới Optimum
// -> lính, bot, súng đeo luôn đậm đà như Block Arena.
const VMAT=new THREE.ShaderMaterial({vertexColors:true,
  uniforms:{uUp:{value:new THREE.Vector3(0,1,0)},uSun:{value:new THREE.Vector3(5,10,3).normalize()}},
  vertexShader:'varying vec3 vC,vN;void main(){vC=color;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uUp,uSun;varying vec3 vC,vN;void main(){vec3 n=normalize(vN);float h=dot(n,uUp)*.5+.5;vec3 hemi=mix(vec3(1.,.839,.902),vec3(1.),h)*1.05;float d=max(dot(n,uSun),0.)*.5;gl_FragColor=vec4(vC*(hemi+d)+vec3(.118),1.);}'});
// KHOẢNG HỞ GIỮA CÁC KHỐI: 1 = SÁT NHAU (không còn khe) -> mặt chung của 2 khối kề nhau trùng khít và bị BỎ HẲN (mesh() / meshLOD() bên dưới).
// Bản cũ dùng .93 (khe 7%, nên mặt chung không trùng khít và không bỏ được). Thử lại kiểu cũ: thêm ?vgap=.93 vào địa chỉ trang.
const VGAP=(()=>{const v=parseFloat(new URLSearchParams(location.search).get('vgap'));return v>0&&v<=1?v:1})();
const VTIGHT=VGAP>=.999;
// Công tắc thử: thêm ?cull=0 vào địa chỉ trang để TẮT việc bỏ mặt khuất (vẫn sát khối) - dùng để xem một lỗi hiển thị có do bỏ mặt hay không.
const VCULL=new URLSearchParams(location.search).get('cull')!=='0';
// BỎ MẶT KHUẤT (mọi giá trị vgap): khối nào có đủ 6 khối cùng cỡ kề sát thì không ai nhìn thấy nó.
//  - vgap=1 (sát nhau): mặt nào có khối kề ngay phía ngoài thì bỏ (hai mặt chung trùng khít nhau).
//  - vgap<1 (có khe): vẫn nhìn xuyên vào khe được, nên GIỮ mọi mặt của khối còn lộ ra ngoài (thành khe sâu ~1 ô), chỉ bỏ mặt giữa 2 khối nằm sâu >= VCULLD ô trong lòng khối.
//  ?culld=N -> tự chọn độ sâu giữ lại (mặc định tự tính theo độ rộng khe; N lớn = khe nhìn sâu hơn, đổi lại bỏ ít mặt hơn).  ?cullbot=1 -> bỏ cả mặt khuất của VB nhớ khối (bot / boss).
const VCULLD=(()=>{const v=parseInt(new URLSearchParams(location.search).get('culld'));return v>=1?v:Math.max(1,Math.ceil((1-VGAP)*10))})();   // tự động: khe càng rộng càng giữ sâu (.93->1 ô, .8->2 ô, .7->3 ô)
const VCULLK=new URLSearchParams(location.search).get('cullbot')==='1';
const FACES=(()=>{const f=[];for(let a=0;a<3;a++)for(const s of[1,-1]){
  const A=(a+1)%3,B=(a+2)%3,u=s>0?A:B,v=s>0?B:A,n=[0,0,0];n[a]=s;
  f.push({n,q:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const p=[0,0,0];p[a]=s;p[u]=x;p[v]=y;return p})})}return f})();
class VB{
  constructor(keep=false){this.keep=keep;this.cc=[];this.cubes=[];this.p=[];this.n=[];this.c=[];this.i=[];this.k=0;this.seed=0}
  cube(x,y,z,sx,sy,sz,hex,ci,cj,ck){
    const h=((ci*73856093)^(cj*19349663)^(ck*83492791)^(this.seed*2654435761))>>>0;
    const col=new THREE.Color(hex).multiplyScalar([.88,.95,1,1.07][(h>>>7)&3]);
    this.cc.push(x,y,z,sx,sy,sz);   // tâm + kích thước (dùng để tìm khối kề khi bỏ mặt khuất)
    if(this.keep)this.cubes.push({x,y,z,sx,sy,sz,hex});
    for(const f of FACES){
      const b=this.k;
      for(const q of f.q){this.p.push(x+q[0]*sx/2,y+q[1]*sy/2,z+q[2]*sz/2);this.n.push(f.n[0],f.n[1],f.n[2]);this.c.push(col.r,col.g,col.b)}
      this.i.push(b,b+1,b+2,b,b+2,b+3);this.k+=4;
    }
  }
  box(cx,cy,cz,w,h,d,col,s=.024,shell=false){
    const nx=Math.max(1,Math.round(w/s)),ny=Math.max(1,Math.round(h/s)),nz=Math.max(1,Math.round(d/s)),cw=w/nx,ch=h/ny,cd=d/nz,g=VGAP;this.seed++;
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
      if(shell&&i>0&&i<nx-1&&j>0&&j<ny-1&&k>0&&k<nz-1)continue;
      const hex=typeof col==='function'?col(i,j,k,nx,ny,nz):col;if(hex<0)continue;
      this.cube(cx+(i+.5-nx/2)*cw,cy+(j+.5-ny/2)*ch,cz+(k+.5-nz/2)*cd,cw*g,ch*g,cd*g,hex,i,j,k);
    }
  }
  // trụ tròn theo trục ax ('x'|'y'|'z'), ri>0 để khoét rỗng (làm vòng)
  cyl(cx,cy,cz,r,len,col,s=.02,ax='z',ri=0){
    const n=Math.max(1,Math.round(2*r/s)),nl=Math.max(1,Math.round(len/s)),cs=2*r/n,cl=len/nl,g=VGAP;this.seed++;
    for(let a=0;a<n;a++)for(let b=0;b<n;b++)for(let l=0;l<nl;l++){
      const u=(a+.5-n/2)*cs,v=(b+.5-n/2)*cs,d2=u*u+v*v;if(d2>r*r*1.05||d2<ri*ri)continue;
      const w=(l+.5-nl/2)*cl,hex=typeof col==='function'?col(a,b,l):col;if(hex<0)continue;
      if(ax==='z')this.cube(cx+u,cy+v,cz+w,cs*g,cs*g,cl*g,hex,a,b,l);
      else if(ax==='x')this.cube(cx+w,cy+u,cz+v,cl*g,cs*g,cs*g,hex,a,b,l);
      else this.cube(cx+u,cy+w,cz+v,cs*g,cl*g,cs*g,hex,a,b,l);
    }
  }
  ell(cx,cy,cz,rx,ry,rz,col,s=.02,shell=false){
    const nx=Math.round(2*rx/s),ny=Math.round(2*ry/s),nz=Math.round(2*rz/s),g=VGAP;this.seed++;
    const ins=(i,j,k)=>((i+.5-nx/2)*s/rx)**2+((j+.5-ny/2)*s/ry)**2+((k+.5-nz/2)*s/rz)**2<=1;
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)for(let k=0;k<nz;k++){
      if(!ins(i,j,k))continue;
      if(shell&&ins(i-1,j,k)&&ins(i+1,j,k)&&ins(i,j-1,k)&&ins(i,j+1,k)&&ins(i,j,k-1)&&ins(i,j,k+1))continue;
      const hex=typeof col==='function'?col(i,j,k):col;
      this.cube(cx+(i+.5-nx/2)*s,cy+(j+.5-ny/2)*s,cz+(k+.5-nz/2)*s,s*g,s*g,s*g,hex,i,j,k);
    }
  }
  mesh(){
    let p=this.p,n=this.n,c=this.c,ix=this.i;
    if(VCULL&&(!this.keep||VCULLK)){try{const r=this.cullFaces();if(r){p=r.p;n=r.n;c=r.c;ix=r.i}}catch(e){console.warn('VB.cullFaces',e)}}
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
    geo.setIndex(Array.isArray(ix)?ix:new THREE.BufferAttribute(ix,1));   // r128: setIndex chỉ nhận mảng thường hoặc BufferAttribute (không nhận Uint16Array)
    geo.computeBoundingSphere();
    // mesh LỚN tĩnh (nhà, chòi, tượng...: bán kính > 3m) cho three.js tự bỏ vẽ khi nằm ngoài tầm nhìn; vật nhỏ / súng cầm tay giữ không cull như cũ (tránh nhấp nháy)
    const m=new THREE.Mesh(geo,VMAT);m.frustumCulled=geo.boundingSphere.radius>3;return m;
  }
}
const chk=(a,b)=>(i,j,k)=>((i+j+k)&1)?a:b;
const DKC=chk(0x3a3850,0x2b2a3a),YLC=chk(0xf2b84b,0xffd76a);

const tri=(a,b,c)=>(i,j,k)=>[a,b,c][(i+j+k)%3];

// ---- BỎ MẶT KHUẤT: tìm mặt nào cần GIỮ. Trả về {keep:Uint8Array(số khối*6), nC} hoặc null (không cắt được) ----
VB.prototype.faceKeep=function(){
  const nC=(this.k/24)|0,cc=this.cc;if(nC<2||!cc||cc.length!==nC*6)return null;
  const G=VGAP;let mn=1e9,mx=0;
  for(let c=0;c<nC;c++){const o=c*6;mn=Math.min(mn,cc[o+3],cc[o+4],cc[o+5]);mx=Math.max(mx,Math.abs(cc[o]),Math.abs(cc[o+1]),Math.abs(cc[o+2]))}
  const Q=Math.min(500,8/mn),OFF=65536;if((mx+1)*Q>=OFF-2)return null;   // quá xa gốc toạ độ cho khoá số nguyên: không cắt (an toàn)
  const key=(x,y,z)=>((Math.round(x*Q)+OFF)*131072+(Math.round(y*Q)+OFF))*131072+(Math.round(z*Q)+OFF);
  const mp=new Map();for(let c=0;c<nC;c++)mp.set(key(cc[c*6],cc[c*6+1],cc[c*6+2]),c);
  const nb=new Int32Array(nC*6).fill(-1);   // nb[c*6+f] = khối cùng cỡ kề sát ở mặt f (hoặc -1)
  for(let c=0;c<nC;c++){
    const o=c*6,sx=cc[o+3],sy=cc[o+4],sz=cc[o+5],cx=sx/G,cy=sy/G,cz=sz/G;   // cx = bề rộng 1 ô (đã tính cả khe)
    for(let f=0;f<6;f++){const nv=FACES[f].n,j=mp.get(key(cc[o]+nv[0]*cx,cc[o+1]+nv[1]*cy,cc[o+2]+nv[2]*cz));
      if(j!==undefined&&Math.abs(cc[j*6+3]-sx)<2e-4&&Math.abs(cc[j*6+4]-sy)<2e-4&&Math.abs(cc[j*6+5]-sz)<2e-4)nb[c*6+f]=j}
  }
  const keep=new Uint8Array(nC*6);
  if(G>=.999){for(let i=0;i<nC*6;i++)keep[i]=nb[i]<0?1:0}   // sát khối: mặt nào có khối kề thì hai mặt chung trùng nhau -> bỏ
  else{
    // có khe: độ sâu = số ô tính từ khối lộ ngoài (lan theo 6 hướng). Chỉ bỏ mặt giữa 2 khối cùng nằm sâu >= VCULLD.
    const dep=new Uint8Array(nC).fill(255),qu=[];
    for(let c=0;c<nC;c++){for(let f=0;f<6;f++)if(nb[c*6+f]<0){dep[c]=0;qu.push(c);break}}
    for(let h=0;h<qu.length;h++){const c=qu[h],d=dep[c];if(d>=VCULLD)continue;
      for(let f=0;f<6;f++){const j=nb[c*6+f];if(j>=0&&dep[j]>d+1){dep[j]=d+1;qu.push(j)}}}
    for(let c=0;c<nC;c++)for(let f=0;f<6;f++){const j=nb[c*6+f];keep[c*6+f]=(j<0||dep[c]<VCULLD||dep[j]<VCULLD)?1:0}
  }
  return {keep,nC};
};
// dựng lại mảng đỉnh chỉ với các mặt được giữ (null nếu không bỏ được mặt nào)
VB.prototype.cullFaces=function(){
  const r=this.faceKeep();if(!r)return null;
  const keep=r.keep,tot=keep.length;let kept=0;for(let i=0;i<tot;i++)kept+=keep[i];
  if(kept===tot)return null;
  const P=this.p,N=this.n,C=this.c,p=new Float32Array(kept*12),n=new Float32Array(kept*12),c=new Float32Array(kept*12),
    ix=(kept*4>65535)?new Uint32Array(kept*6):new Uint16Array(kept*6);
  let q=0;
  for(let i=0;i<tot;i++){if(!keep[i])continue;const s=i*12,w=q*12;   // mặt (khối c, hướng f) bắt đầu ở đỉnh c*24+f*4 = i*4
    for(let k=0;k<12;k++){p[w+k]=P[s+k];n[w+k]=N[s+k];c[w+k]=C[s+k]}
    const b=q*4,o=q*6;ix[o]=b;ix[o+1]=b+1;ix[o+2]=b+2;ix[o+3]=b;ix[o+4]=b+2;ix[o+5]=b+3;q++}
  return {p,n,c,i:ix};
};


const PX=.056;                       // 1 điểm ảnh skin = 5.6cm -> nhân vật cao ~1.8m
const KEY='ba_char';

// ---------- nhiễu giá trị (không có thư viện ngoài) ----------
const hb=(a,b,c,s)=>{let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul(c|0,1442695041)+Math.imul(s|0,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296};
const sm=t=>t*t*(3-2*t),lp=(a,b,t)=>a+(b-a)*t;
function vn(x,y,z,s){
  const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=sm(x-xi),fy=sm(y-yi),fz=sm(z-zi),g=(a,b,c)=>hb(xi+a,yi+b,zi+c,s);
  return lp(lp(lp(g(0,0,0),g(1,0,0),fx),lp(g(0,1,0),g(1,1,0),fx),fy),lp(lp(g(0,0,1),g(1,0,1),fx),lp(g(0,1,1),g(1,1,1),fx),fy),fz);
}
const shade=(hex,f)=>{const r=Math.min(255,Math.round((hex>>16&255)*f)),g=Math.min(255,Math.round((hex>>8&255)*f)),b=Math.min(255,Math.round((hex&255)*f));return(r<<16)|(g<<8)|b};
// Hoa văn quân phục. kind: 'plain' = gần như trơn (vài điểm sậm) · 'blob' = mảng rằn ri mềm (woodland / multicam) · 'pix' = mảng vuông 2x2 (kiểu digital)
// pal: các màu (sậm -> sáng, màu chủ đạo ở giữa) · sc: hệ số phóng to mảng (dùng cho tay áo góc nhìn thứ nhất, nhỏ hơn nên cần mảng lớn hơn)
function camoFn(pal,kind,seed,sc=1){
  const n=pal.length;
  if(kind==='plain')return(i,j,k)=>(hb(i,j,k,seed)*.5+vn(i/2.4/sc,j/2.4/sc,k/2.4/sc,seed)*.5)>.8?pal[1]:pal[0];
  return(i,j,k)=>{
    let v;
    if(kind==='pix'){const a=Math.floor(i/(2*sc)),b=Math.floor(j/(2*sc)),c=Math.floor(k/(2*sc));v=.72*vn(a*2/3.4,b*2/3.4,c*2/3.4,seed)+.28*hb(a,b,c,seed+9)}
    else v=.7*vn(i/3.4/sc,j/3.4/sc,k/3.4/sc,seed)+.3*vn(i/1.7/sc+5,j/1.7/sc,k/1.7/sc,seed+3);
    v=(v-.5)*1.7+.5;
    return pal[Math.max(0,Math.min(n-1,Math.floor(v*n)))];
  };
}

// ---------- cờ trên tay áo (R đỏ, B xanh dương, W trắng, Y vàng, G xanh lá, O cam, K đen) ----------
const FC={R:0xd02a2a,B:0x1d56b8,W:0xf4f4f4,Y:0xffd23f,G:0x1f9a4a,O:0xff9933,K:0x222222};
const FLAG={
  vn:['RRRR','RYYR','RYYR','RRRR'],
  us:['BBRR','BBWW','RRRR','WWWW'],
  ru:['WWWW','BBBB','RRRR'],
  ng:['GWWG','GWWG','GWWG'],
  bd:['GGGG','GRRG','GGGG'],
  id:['RRRR','WWWW'],
  in:['OOOO','WBBW','GGGG'],
  cn:['RYRR','RRRR','RRRR'],
  ph:['WBBB','WYRR','WRRR'],
  ua:['BBBB','YYYY'],
  kr:['WWWW','WRBW','WWWW']
};

// ---------- 11 nhân vật ----------
// k: mã nhân vật · lang: ngôn ngữ của quốc gia đó · cc: mã quốc gia (tên nước hiển thị theo ngôn ngữ đang chọn)
// uni: quân phục {pal,kind,seed} · hat: {kind: helmet|pith|beret|cap|boonie|ushanka, c: màu/hoa văn, badge: huy hiệu trước mũ}
// vest: áo giáp / áo dã chiến ngoài (màu) · pack: ba lô · tabs: phù hiệu cổ áo · glove: găng tay (null = tay trần) · boots · belt · skin · hair
const CH=[
  {k:'vn',lang:'vi',cc:'VN',skin:0xf0c9a2,hair:0x15110d,uni:{pal:[0x4c6633,0x56703a],kind:'plain',seed:11},
   hat:{kind:'pith',c:0x62803e,brim:0x4c6633,badge:'star'},tabs:0xd42a2a,boots:0x2b2b26,belt:0x3a2f1f,glove:null,vest:null,pack:null},
  {k:'us',lang:'en',cc:'US',skin:0xf2cdb0,hair:0x4a3220,uni:{pal:[0x5a4a36,0xa89874,0x7b7d52,0x4f5a34],kind:'blob',seed:21},
   hat:{kind:'helmet',c:'uni',nvg:true},vest:0x8a7a58,pouch:0x6e6044,pack:0x6e6a48,glove:0x2a2a2a,boots:0x8a6f4a,belt:0x5a4a32,knee:true},
  {k:'ru',lang:'ru',cc:'RU',skin:0xf3d0b8,hair:0xb98f58,uni:{pal:[0x3b4a2c,0x6c7a48,0xb5a672,0x5a4631],kind:'pix',seed:31},
   hat:{kind:'ushanka',c:0x8a868c,badge:'star'},vest:0x4a5236,pouch:0x3a4128,pack:0x4a5a3a,glove:0x1f1f1f,boots:0x2a2420,belt:0x2f2a22},
  {k:'ng',lang:'ng',cc:'NG',skin:0x5a3a28,hair:0x0d0b0a,uni:{pal:[0x2f3b24,0x55703a,0x7a6238,0xa89c6d],kind:'blob',seed:41},
   hat:{kind:'beret',c:0x2a4a2a,badge:0xd9b13b},boots:0x2b2822,belt:0x2a2a22,glove:null,vest:null,pack:null},
  {k:'bd',lang:'bn',cc:'BD',skin:0xa87048,hair:0x100c0a,uni:{pal:[0x2a3d22,0x4b6a36,0x6a7a40,0x3c3220],kind:'blob',seed:51},
   hat:{kind:'cap',c:'uni',visor:0x2a3a22,badge:0xd02a2a},boots:0x1c1c1c,belt:0x2a2a22,glove:null,vest:null,pack:null},
  {k:'id',lang:'id',cc:'ID',skin:0xc08a58,hair:0x0e0b09,uni:{pal:[0x1f2a17,0x4a5a2e,0x7a5a30,0x9a8a58],kind:'blob',seed:61},
   hat:{kind:'beret',c:0xb01820,badge:0xd9b13b},vest:0x2d3524,pouch:0x20281a,glove:0x1c1c1c,boots:0x1c1c1c,belt:0x2a2a22,pack:null},
  {k:'in',lang:'hi',cc:'IN',skin:0xb98258,hair:0x0c0a09,uni:{pal:[0x3a3a28,0x6a6a3a,0x8a6a3c,0x55603a],kind:'pix',seed:71},
   hat:{kind:'beret',c:0x7a1e2a,badge:0xd9b13b},boots:0x2a2420,belt:0x2f2a22,glove:null,vest:null,pack:null},
  {k:'cn',lang:'zh',cc:'CN',skin:0xf0c8a0,hair:0x0d0b0a,uni:{pal:[0x2e3a22,0x587036,0x8a9a5a,0xb2a47a,0x3a2e1e],kind:'pix',seed:81},
   hat:{kind:'helmet',c:'uni',badge:'star'},vest:0x4a5535,pouch:0x3a4428,pack:0x44502f,glove:0x2a2a2a,boots:0x1f1f1f,belt:0x2f2a22},
  {k:'ph',lang:'fil',cc:'PH',skin:0xc89868,hair:0x120e0b,uni:{pal:[0x2c3c22,0x4c6a3a,0x7a8a50,0x5a4a30],kind:'pix',seed:91},
   hat:{kind:'boonie',c:'uni'},boots:0x3a3328,belt:0x2f2a22,glove:null,vest:null,pack:null},
  {k:'ua',lang:'uk',cc:'UA',skin:0xf1cfb4,hair:0x6a4a2a,uni:{pal:[0x3d3a22,0x6b6c3c,0xa28f5c,0x4a3a28],kind:'pix',seed:101},
   hat:{kind:'helmet',c:'uni',badge:'ua'},vest:0x6a5a3c,pouch:0x54482e,pack:0x5a5030,glove:0x2a2a2a,boots:0x6b5a3c,belt:0x4a3f2a,knee:true},
  {k:'kr',lang:'ko',cc:'KR',skin:0xf0d0b4,hair:0x0d0c0b,uni:{pal:[0x2a3326,0x47573a,0x7a7650,0x1f1f1a],kind:'pix',seed:111},
   hat:{kind:'cap',c:'uni',visor:0x1f1f1a,badge:0xd9b13b},boots:0x1a1a1a,belt:0x1f1f1a,glove:null,vest:null,pack:null}
];
const BYK={},BYLANG={};for(const c of CH){BYK[c.k]=c;BYLANG[c.lang]=c}

// ---------- LOGO VÔ CỰC (cùng dữ liệu mẫu với statues.js / house.js: lưới 120x66, '.' = trống, ký tự = độ sáng) ----------
const LOGO_W=120,LOGO_H=66,LOGO_ASPECT=1.8207,LOGO_B64='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
const LOGO_PX=[
  '............................hjklmmmkj..............................................jkllmmnk.............................',
  '........................jkmqsuwyyyxwutspok....................................imortvxxyyzzxwvsqn........................',
  '.....................jlqvBGKMOPPPPPPOMKGBxson..............................kmpuAGKMPQQQQQQPOMKFBxup.....................',
  '...................jnvDJMMJHFDDCDDEFIJMOPOKEzto..........................kovCJOQONMMMMNNOOPQRRRQNJEyro..................',
  '.................jntCKKGBzxxxxyyyzzAABCEGKPQPGxtm......................intENQOKIIJKLMNNNOOPPQRSSTTQKFAs.................',
  '................kqAGGCywwwwxxxxyyyzzzzAABDGJMPMExrl...................lsBKOLIHIJKLLMMNNOOOPPQQRSTUUTRMFwo...............',
  '..............imuCBywvvvwwwxxxxyyyyzzzzzABCDFIMPLEwo................jozKMJGGHJKLLLMMMMNNOOPPPQQRRSUVXWSLDv..............',
  '.............kpwzwuvvvvwwwwxxxyyyyyzzzzzzAABCDGJNPKAuo............jmuGMIEFHIJKLLMMMMNNNNNOOPPQQRRRSTUWYWRJBq............',
  '...........hkrwwuuuvvvvvwwwxxyyzzzyyyyyyyyzAACDEHKOOJCvqok.....kmpwELKFFGIJKLMNNNNNMMMMMNNOOPPQQQRSTTUVYYWPFu...........',
  '...........kqvutuuuuvvvwwwxyzAAzzzyxxwwwwwwyzABCEGJNPPKCxvtrqrstzGNNIDEHIJLMNOOONMLJJJIJJKLNOOPPQQRSTUUVY+YQHr..........',
  '..........jottttuuuuvvwxxyABBBBBCDEFEDCBywvuvwyABDFIKMPPOLIHGHKMONJFDFHJKNPQQPNLKJJIHHGFEEFIJLNPQQRSTUUUVYZYQFq.........',
  '........ginrsttuuvvvvwxzBDEDEGKNPQQPPPPPNKFAwtuwyABDEGHJLMNONMLJGFEFHJKOQSRPNMNPQQQQQQQOLIECCDHLNPQRSTUUVVXZYRIu........',
  '........imqrsttuuvvwwyBFGGHLOPNJEByvuuwyCHMOLEwtuwzBCCEEFFFGFFFFFGHIJMQTTQOPQPMHDAyxzBDGKOOMICADHLPQRSUUVVVX+ZTKs.......',
  '.......hlpqsttuuvvwxzDIJJMPNIBtr..........puCKKBvtuyACDDEEFFFFGGHIJKNSTRPPPJBtr.........qtAHMNHAzDIOQRTUVVVWX++UG.......',
  '......gjnqrstuuvvwwzEJLMOPIzqk..............jqDLGyttwzBDDEEFFGGHHJMPSSQPPLym..............lpwFOIByBINQSUVVVWWY+ZQz......',
  '......hlprsstuuvvwzFKMNPMDv...................myIJBvuvyACDEEFGHIJLOQQPQNCs...................qALKCxBHNRTUVVWWXZ+XLs.....',
  '.....gjnqssstuvvwzHNOOPGyq......................ozJIEzwwyzBCEFGHJLMOPPFs......................mtDJCwzFNRTVWWWWX+/VF.....',
  '....ghlprsstuvvwzGPRPODu..........................qDLMJGDCBCDFHJMPRPJw..........................owGAwyGOSUVWWWXY++Qy....',
  '....hjnqssstuvvxEOTQPDu............................krBKONMLMNPRSSOHyo............................nvEyvAJRTVWWWXX+/WLr...',
  '...ghkorssstuvwAKTRPGw................................quBFIJKJHEzt................................nwBwvDNSTVWXXXY+ZSA...',
  '...gimpsssstuvyHTUPFy..............................................................................ntytxGPSUWXXXXZ+ZM...',
  '...hknrrssstvxEPWRGyq..............................................................................jmsvtAJRTVWXXXY++Tw..',
  '..gilprrsstuvALWWLAp................................................................................jmutvENSTVWXXY+/YG..',
  '..gjmqrrsstuwFSYSDw..................................................................................kputzJRTUWXXY+/+Pp.',
  '..gknqrrsstuyKWYNzr..................................................................................jltrvEPTUVWXYZ//Tw.',
  '..hlprrrsstvBRZWGw....................................................................................jptsAMSTUWXYY+/XA.',
  '.gilprrrstuwFW+TBs....................................................................................ilurwISTUVWXYZ/ZH.',
  '.gimqrrrstuxKYZOzp.....................................................................................jtrtFQTUVWXYZ/+O.',
  '.gjnqrrrstvyN+YKy......................................................................................jrtsCPSUVWXYZ//Qp',
  '.gjnqrrrttvAQ+XHw......................................................................................ipvsBOTTUVXXY+/St',
  '.gjoqrrstuvBS+VFu......................................................................................hnwrzMSTUVXYY+/Ux',
  'fgjoqrrstuvCU+UDs......................................................................................ilxryLSTUVXYY+/Vw',
  'ggjoqqrstuvDU+TCt......................................................................................ilxsxLSTUWXYY+/Wv',
  'fgjoqrrttuvCU+UDs......................................................................................ilxsxKSTUWXYY+/Wv',
  'ggjoqrsttuvCT+UDs......................................................................................hlxsxLSUVWXYY+/Vv',
  'hginqrsttuvBS+VEt......................................................................................hnxsyMSUVXYYY+/Vw',
  'hginqrsttuvzQ+XHw......................................................................................ipwsANTUWXYYY+/Tv',
  '.gimqrsstuvyO+ZKy......................................................................................irvtCOTVWXXYY++Qq',
  '.gimqrrstuvxLZ+Ozo.....................................................................................jutuEQTVWXYYZ/+Om',
  '.hhlprrstuuwGW+TBr....................................................................................hkvswHRUWXXYYZ/ZK.',
  '.hhkoqrsttuvCS+XFv....................................................................................hovtzKSVWXXYY+/XC.',
  '.hhjnqrrstuvzNYZNyq...................................................................................jttwDOUVWXXYY+/Ty.',
  '..hilprrsstuxHUZTBt..................................................................................hmwtyHRUVWXXYZ/+Pq.',
  '..hikorrrrtuvCOYWIxl.................................................................................jsvwBLSUVXXXY+/YJ..',
  '..gijmqrrrstvyGTYQBv................................................................................inxvAHPTUWXXXY++Uz..',
  '...iikprrrrsuvAKWWKyt..............................................................................ilxxyFNSTVWXXXZ+YNr..',
  '...hijnqrrrstuwCPXSIyr.................................lnortutrqo.................................imxzyCLQSUVWXXY+ZTD...',
  '...hijlprrrrstvxHTWQFwp.............................klqtyCFIJJIFAxrn.............................hlwAzBHPRSUVWXXZ+WMu...',
  '....ijknrrrrssuvAKUUNCvn..........................jnsyCHKNOPPQQQOLFztn..........................iltBBBFMRSTUVWXX+ZRE....',
  '.....jklprrrsstuwCMSTMCwq........................luCHKONMLKKLMOQRSQNIBs........................knvDDDELQRSTUWWXZ+UIq....',
  '.....ikknprrssstuwCJQRMExuo....................lsAEHIGEDDEEFGHJKNPSTSNGyq....................jlsAFGEFKQRSTTVWXY+XNv.....',
  '......kllnqssssstvxCIPRMHyurl................jnxEEFCAABCDEEFFGGHJLPSVVPJBvm.................lnuEHJGGLPRRSTUVWY+YRF......',
  '......immmorsssstuvxBINQNJDwtqn............lnuCFEDAyABCDDEEFFFFGGIKNRVWSMFzsq............klorAGLKHHMPRSSTUUVXZZULu......',
  '.......lnnmorsssstuvxAFKOPOJEzvtqpqonmnonquyDHHEAyyBBCCDDDDDDDEEFGHIKPUWWRMFByurronmmopoqtyCHLNKHJNPQRSTUUVWZYTNy.......',
  '........nponprsssttuvwyCFINQPNKGDBAyyyzBDGJLLHCyyzBCDEEDCCBBAAAzACEFHJMRUVUROLHEBAzzyzACFJMOPMJJLOQRRSTUUVWYYSOC........',
  '.........nrqoprssttuvvwxyAEHKNPQPONMMMNNONKHCzyzBBDEFEEFHJKLLJHEAyyzCFILNQSTUTSQPONNNNOPQQOMKKMOPQRSSTTUVWYWSPB.........',
  '..........pvroprstttuvwwxxyBCDFILMNONNMKGCAzzzABCDFGGGLQUUVVVVUTPHAwxAEHIKNPQRRSSSSSRQQONLLLMNPQRRSSTTTUWYWRRC..........',
  '...........rxtppqstttuvvwwxxyzABBCCCCCBAzzzzzABCEFGIMRTOFACyyCAGOSOHAwzDGHJLMNOPOPOOONMMMMNOPPQQRRSSTTUWWUSRE...........',
  '............rBztqqsttuvvvwwwwxxxyyyyyzzzzzzzABCEFHLSTJx..........vJSQGyxAEGIJKLMMMMNNNNNNOOPPPQQRRSSTUVURRSE............',
  '.............rDHAtqqsttuvvvvwwwwxxxxyyyyzzAABDEGJPTIv..............tGSNCyyBFHIJKLLMMMMMNNNOOPPQQQRSTUTRQSNy.............',
  '...............vJJAvrrstuuvvvwwwwxxxyyyyzAABCEJPTQy..................wNRLEzyBDGIJKLLLMMMNNOOPPQQRRRQPPSRD...............',
  '................oJQMEwsrsstuvvwwwwxxxxyyzABCGMTTHs....................pJTSLDzzADGHJKLLMMNNOOOPPPPNMNRUOu................',
  '..................zLQNGAwutttuuvvvwwxxyzBEJOSTKv........................wISRNIDBBCEFHIJKKLLLMLLLLNRTPD..................',
  '....................vFQSQMHECAzzzAABCFILQTUPFw............................vEOTSPMIGFEEEFGGHIKMPSUTHz....................',
  '.......................yAKQSSSRRRSSSTTSQKBu..................................tBJPTTTSRRRRSTTTRMDCq......................',
  '............................vxABAzzzyv............................................wzBDEEFCyxy...........................'
].join('');
const LOGO_CACHE={};
function logoGrid(nx,ny){
  const key=nx+'x'+ny;if(LOGO_CACHE[key])return LOGO_CACHE[key];
  const out=new Array(nx*ny).fill(-1);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const ya=Math.floor(j*LOGO_H/ny),yb=Math.max(Math.floor((j+1)*LOGO_H/ny),ya+1),xa=Math.floor(i*LOGO_W/nx),xb=Math.max(Math.floor((i+1)*LOGO_W/nx),xa+1);
    let cnt=0,tot=0,sum=0;
    for(let r=ya;r<yb;r++)for(let c=xa;c<xb;c++){tot++;const ch=LOGO_PX[r*LOGO_W+c];if(ch!=='.'){cnt++;sum+=LOGO_B64.indexOf(ch)}}
    if(cnt/tot>=.5)out[j*nx+i]=Math.round(sum/cnt/63*255);
  }
  return LOGO_CACHE[key]=out;
}
// logo vô cực (đơn vị điểm ảnh) tại tâm (cx,cy,cz), rộng LW, ô LS, dày dz, hướng mặt +z; đúng hình dạng/độ dày/sắc độ logo gốc, tô màu hex
function logoPx(v,cx,cy,cz,LW,LS,dz,hex){
  const nx=Math.round(LW/LS),ny=Math.round(nx/LOGO_ASPECT),LH=LW/LOGO_ASPECT,gr=logoGrid(nx,ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const l=gr[j*nx+i];if(l<0)continue;
    const u=(-.5+(i+.5)/nx)*LW,y=cy+(.5-(j+.5)/ny)*LH;
    v.cube((cx+u)*PX,y*PX,cz*PX,LS*.98*PX,LS*.98*PX,dz*PX,shade(hex,.7+.5*Math.max(0,Math.min(1,(l-60)/190))),i,j,0);
  }
}

// ---------- dựng mô hình ----------
function B(vb,x,y,z,w,h,d,col){vb.box(x*PX,y*PX,z*PX,w*PX,h*PX,d*PX,col,PX,true)}   // hộp tính bằng điểm ảnh (tâm x,y,z · rộng,cao,dài)
function hatOf(def,U){return def.hat.c==='uni'?U:def.hat.c}
function addHat(v,def,U){
  const h=def.hat,c=hatOf(def,U),RED=0xd02a2a,YEL=0xffd23f;
  const badge=(x,y,z)=>{
    if(h.badge==='star')B(v,x,y,z,3,3,1,(i,j)=>(i===1&&j===1)?YEL:RED);
    else if(h.badge==='ua')B(v,x,y,z,3,3,1,(i,j)=>j>=1?0x1d56b8:0xffd23f);
    else if(h.badge)B(v,x,y,z,2,2,1,h.badge);
  };
  switch(h.kind){
    case 'helmet':
      B(v,0,31,0,10,4,10,c);                            // mũ chụp (hoa văn như quân phục)
      B(v,0,29.5,0,11,1,11,shade(typeof c==='function'?def.uni.pal[1]:c,.7));   // vành mũ
      B(v,0,30,-5.5,10,3,1,c);                          // phần che gáy
      if(h.nvg)B(v,0,32,5.5,3,2,1,0x1f1f1f);            // giá gắn kính nhìn đêm
      badge(0,31,5.5);break;
    case 'pith':                                        // mũ cối
      B(v,0,29.5,0,12,1,12,h.brim);B(v,0,31,0,9,2,9,c);B(v,0,32.5,0,7,1,7,c);
      B(v,0,30.5,4.5,9,1,1,shade(c,.75));badge(0,31,5);break;
    case 'beret':
      B(v,0,30.5,0,10,3,10,c);B(v,1,32.5,0,9,1,9,c);B(v,4.5,29.5,2,2,2,5,c);
      badge(-2.5,31,5.5);break;
    case 'cap':
      B(v,0,30.5,0,9,3,9,c);B(v,0,32.5,0,9,1,9,typeof c==='function'?def.uni.pal[0]:shade(c,.85));
      B(v,0,29.5,6,8,1,4,h.visor);badge(0,31,5);break;
    case 'boonie':
      B(v,0,31.5,0,9,3,9,c);B(v,0,29.5,0,13,1,13,typeof c==='function'?def.uni.pal[0]:shade(c,.8));
      B(v,0,30.5,4.5,9,1,1,0x2a2a22);break;
    case 'ushanka':
      B(v,0,31,0,10,4,10,c);if(def.head==='square'){B(v,-5,27.5,0,2,5,6,shade(c,.85));B(v,5,27.5,0,2,5,6,shade(c,.85))}
      B(v,0,29.5,-5.5,10,3,1,shade(c,.85));badge(0,31,5.5);break;
  }
}
// Dựng nhân vật -> {g, armL, armR, legL, legR}. Mặt nhìn về +z. Chân chạm y=0.
function build(def){
  const g=new THREE.Group(),U=camoFn(def.uni.pal,def.uni.kind,def.uni.seed),sk=[def.skin,shade(def.skin,.94)],SKN=(i,j,k)=>((i+j+k)&1)?sk[0]:sk[1];
  const RED=0xd02a2a,mouth=shade(def.skin,.62),gl=def.glove;
  const grp=(x,y)=>{const q=new THREE.Group();q.position.set(x*PX,y*PX,0);g.add(q);return q};
  // đầu
  {const hv=new VB(),H=def.hair;
    const HSC=.81,hg=new THREE.Group();   // HSC: thu nhỏ toàn bộ đầu (cầu + kính VR + mũ) quanh đáy đầu (y=20 điểm ảnh) -> cằm vẫn dính cổ
    hg.scale.setScalar(HSC);hg.position.y=20*PX*(1-HSC);g.add(hg);
    if(def.head!=='square'){   // ĐẦU TRÒN (mặc định cho MỌI nhân vật; ghi head:'square' trong mảng CH để dùng lại đầu vuông cũ)
      const R=10.5,CY=30.5,HS=1.5,HY=43.5;   // R: bán kính đầu (điểm ảnh) · CY: độ cao tâm đầu · HS: phóng to mũ · HY: độ cao mà đỉnh đầu vuông cũ (y=32) được dời tới (mũ nằm trên đỉnh quả cầu)
      hv.ell(0,CY*PX,0,R*PX,R*PX,R*PX,(i,j,k)=>(i*7+j*13+k*5)%5===0?0xb4bac2:((i+j+k)&1)?0x9aa0a8:0x8a9098,PX);
      // vx: 1 điểm ảnh dán lên mặt cầu · x = cột (tâm) · dy = hàng so với tâm đầu · z tính theo mặt cầu -> kính / miệng ôm cong theo đầu
      const vx=(x,dy,col)=>B(hv,x,CY+dy,Math.sqrt(Math.max(0,R*R-dy*dy-x*x))-.5,1,1,3,col);
      // KÍNH VR THỰC TẾ ẢO (giống tượng bên trái): kính phồng bao mặt + dây đeo quanh đầu + đệm hai bên + logo vô cực chuẩn trên mặt kính
      const VY=CY+4,cst=q=>()=>q,VD=0x20232b,VL=0x2e323d;
      // dây đeo quấn quanh đầu (bỏ phần phía trước, chỗ kính che)
      {const r=Math.sqrt(R*R-(VY-CY)*(VY-CY))+.7,N=72;
        for(let n=0;n<N;n++){const t=n/N*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(t),Math.cos(t)))<.9)continue;
          hv.cube(Math.sin(t)*r*PX,VY*PX,Math.cos(t)*r*PX,2.1*PX,3.8*PX,2.1*PX,(n&1)?0x2b2f38:0x23262e,n,0,0)}}
      for(const sx of[-1,1])B(hv,sx*10.4,VY,4.5,2.8,5.6,6.5,VL);     // đệm / khớp nối dây hai bên
      hv.ell(0,VY*PX,8*PX,10.8*PX,4.9*PX,5.4*PX,cst(VD),PX,true);   // thân kính phồng ôm mặt
      B(hv,0,VY,12.3,15.5,8.6,2,0x0e1117);                           // mặt kính tối phẳng
      B(hv,0,VY+4.7,12.3,16.5,1,2.4,VL);B(hv,0,VY-4.7,12.3,16.5,1,2.4,VL);   // viền trên / dưới mặt kính
      logoPx(hv,0,VY,13.4,13.5,.5,.8,0xe8f8ff);                      // logo vô cực (lấy mẫu từ logo gốc)
      // MIỆNG HÁ: T = răng trên · D = bên trong sẫm · r = lưỡi đỏ · l = viền môi · B = răng dưới
      const MOUTH=[' TTTTTTTT ','lDDDDDDDDl','lDDDDDDDDl','lDDrrrrDDl','lDrrrrrrDl','lDDrrrrDDl',' BBBBBBBB '];
      MOUTH.forEach((s,r)=>{for(let c=0;c<10;c++){const ch=s[c];if(ch===' ')continue;
        vx(c-4.5,-1-r,ch==='T'||ch==='B'?(c&1?0xffffff:0xe4e6ea):ch==='l'?0x8a9098:ch==='D'?0x1c0a0e:0x7a1a26)}});
      // mũ: dựng riêng, phóng HS lần rồi đặt lên đỉnh quả cầu
      const hh=new VB();addHat(hh,def,U);const hm=hh.mesh();hm.scale.setScalar(HS);hm.position.y=(HY-32*HS)*PX;hg.add(hm);
    }else{
      hv.box(0,28*PX,0,8*PX,8*PX,8*PX,(i,j,k)=>{
        if(j===7)return H;
        if(k===7){
          if(j===3){if(i===1||i===6)return 0xffffff;if(i===2||i===5)return 0x2a2018}
          if(j===4&&(i===1||i===2||i===5||i===6))return H;
          if(j===1&&(i===3||i===4))return mouth;
          return j>=5?H:SKN(i,j,k);
        }
        if(k===0)return j>=1?H:SKN(i,j,k);
        if(i===0||i===7)return j>=4?H:SKN(i,j,k);
        return SKN(i,j,k);
      },PX,true);
      addHat(hv,def,U);
    }
    (def.head!=='square'?hg:g).add(hv.mesh());}
  // thân (áo + áo giáp + thắt lưng + phù hiệu cổ áo)
  {const bv=new VB(),vest=def.vest,pc=def.pouch;
    bv.box(0,18*PX,0,8*PX,12*PX,4*PX,(i,j,k,nx,ny,nz)=>{
      const fr=k===nz-1,bk=k===0;
      if(j===1)return def.belt;
      if(vest&&(fr||bk)&&j>=2&&j<=9&&i>=1&&i<=6){
        if(fr&&j>=2&&j<=4&&(i<=2||i>=5))return pc;   // 2 túi đạn hai bên
        if(fr&&j===4&&(i===3||i===4))return shade(vest,.8);
        return vest;
      }
      if(vest&&j>=10&&(i===1||i===6)&&(fr||bk))return vest;   // quai vai áo giáp
      if(def.tabs&&fr&&j>=9&&(i===1||i===2||i===5||i===6))return def.tabs;
      return U(i,j,k);
    },PX,true);
    if(def.pack)B(bv,0,19,-3,7,8,2,def.pack);
    if(def.pouch&&vest){B(bv,-2.5,15.5,2.5,2,3,1,def.pouch);B(bv,2.5,15.5,2.5,2,3,1,def.pouch)}   // 2 túi đạn nổi
    g.add(bv.mesh());}
  // tay (gốc xoay ở vai) - tay áo hoa văn, tay trần / găng, huy hiệu cờ ở mép ngoài tay áo
  const mkArm=sx=>{
    const q=grp(sx*6,24),av=new VB();
    av.box(0,-6*PX,0,4*PX,12*PX,4*PX,(i,j,k)=>j<=2?(gl||SKN(i,j,k)):U(i+(sx>0?4:0),j,k),PX,true);
    const fl=FLAG[def.k];
    if(fl){const rows=fl.length;
      // mặt ngoài của tay nhìn từ ngoài vào: cột cờ chạy ngược chiều k ở tay phải, thuận chiều k ở tay trái -> cờ luôn đọc đúng chiều
      B(av,sx*2.5,-3.5-rows/2+.5,0,1,rows,4,(i,j,k)=>{const col=sx>0?3-k:k,row=rows-1-j;return FC[fl[row][col]]});}
    q.add(av.mesh());return q;
  };
  const armL=mkArm(-1),armR=mkArm(1);
  // chân (gốc xoay ở hông) - quần hoa văn, ống giày
  const mkLeg=sx=>{
    const q=grp(sx*2,12),lv=new VB();
    lv.box(0,-6*PX,0,4*PX,12*PX,4*PX,(i,j,k,nx,ny,nz)=>{
      if(j<=2)return def.boots;
      if(def.knee&&k===nz-1&&j>=5&&j<=6&&i>=1&&i<=2)return shade(def.vest||0x444444,.7);
      return U(i,j+3,k+(sx>0?5:0));
    },PX,true);
    q.add(lv.mesh());return q;
  };
  const legL=mkLeg(-1),legR=mkLeg(1);
  return {g,armL,armR,legL,legR};
}


window.Soldier={list:CH,VB:VB,
  make:function(k){return build(BYK[k]||CH[0])},
  // tay áo / màu da / găng cho góc nhìn thứ nhất (giống CharPick.fp() của game 2)
  fp:function(k){const c=BYK[k]||CH[0];return {sleeve:camoFn(c.uni.pal,c.uni.kind,c.uni.seed,1.7),cuff:shade(c.uni.pal[Math.min(1,c.uni.pal.length-1)],.55),skin:[c.skin,shade(c.skin,.95)],glove:c.glove,band:c.belt}}
};
})();
