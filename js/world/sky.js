/* ------------------------------ SKY, TIME, SEASON ------------------------------ */
const SEASONS={
  spring:{grass:0x8CC98A, ground:0xDFE4E9, leaf:0x74C177},
  summer:{grass:0x74BE79, ground:0xE2E6EA, leaf:0x64E27F},
  autumn:{grass:0xC0AC72, ground:0xE1DDD5, leaf:0xFEA158},
  winter:{grass:0xDCE6EE, ground:0xEDF1F5, leaf:0xCBD9E4}
};
const SKIES={
  dawn:  {exp:0.98, top:'#33558C',mid:'#D2917E',low:'#FDE3CB', sun:0xFFC894, si:0.62, hemi:0.46, fog:0xFAE0C8, star:0.25},
  day:   {exp:0.94, top:'#3F91E4',mid:'#A9CDEC',low:'#EDF1F5', sun:0xFFF6E6, si:0.95, hemi:0.62, fog:0xEDF1F5, star:0},
  golden:{exp:1.00, top:'#4A7FBE',mid:'#FEA158',low:'#FFDCB4', sun:0xFFBE6E, si:0.8,  hemi:0.5,  fog:0xFFDCB4, star:0.1},
  dusk:  {exp:1.18, top:'#232B44',mid:'#8E6BB5',low:'#C79CD6', sun:0xC79BFF, si:0.4,  hemi:0.4,  fog:0xC3A0CE, star:0.55},
  night: {exp:1.42, top:'#080D18',mid:'#141C2C',low:'#282C34', sun:0x9DB0C2, si:0.12, hemi:0.22, fog:0x232A36, star:1}
};
function seasonNow(){
  const m=new Date().getMonth();
  if(m<2||m===11) return 'winter';
  if(m<5) return 'spring';
  if(m<8) return 'summer';
  return 'autumn';
}
/* The sky follows the player's own clock and nothing else. The old
   'night city' reward left a flag in storage; it is cleared here once so
   nobody who earned it stays in the dark. */
try{ localStorage.removeItem('optimum-world:night'); }catch(e){}
function phaseNow(){
  if(/[?&]visit=1(&|$)/.test(location.search)) return 'day';   // chế độ tham quan (từ game from0tohero): luôn ban ngày cho rực rỡ
  const h=new Date().getHours()+new Date().getMinutes()/60;
  if(h<5.5) return 'night';
  if(h<7.5) return 'dawn';
  if(h<17) return 'day';
  if(h<19) return 'golden';
  if(h<20.5) return 'dusk';
  return 'night';
}
function weatherNow(){
  if(/[?&]visit=1(&|$)/.test(location.search)) return 'clear';   // tham quan: luôn trời quang (không mây mù / mưa)
  const r=Math.random();
  if(r<0.62) return 'clear';
  if(r<0.82) return 'cloudy';
  if(r<0.94) return (SEASON==='winter'?'snow':'rain');
  return 'fog';
}
let SEASON=seasonNow(), PHASE=phaseNow(), WEATHER='clear';
let DARK=false;
function skyTexturePhase(){
  const k=SKIES[PHASE], c=cvs(4,256), g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,k.top); gr.addColorStop(0.55,k.mid); gr.addColorStop(1,k.low);
  g.fillStyle=gr; g.fillRect(0,0,4,256);
  return tex(c);
}

function photoTex(url){
  const t=new THREE.TextureLoader().load(url, tx=>{
    tx.anisotropy=MAXANISO;
    tx.minFilter=THREE.LinearMipmapLinearFilter;
    tx.magFilter=THREE.LinearFilter;
    tx.generateMipmaps=true;
    tx.encoding=THREE.sRGBEncoding;
    tx.needsUpdate=true;
  });
  t.anisotropy=MAXANISO;
  t.minFilter=THREE.LinearMipmapLinearFilter;
  t.magFilter=THREE.LinearFilter;
  t.encoding=THREE.sRGBEncoding;
  return t;
}
/* a photo redrawn onto a square canvas at a fixed size, gently sharpened.
   used for the small community avatars so a 288px source still reads clean. */
function sharpTex(url,size){
  const S=size||512, c=cvs(S,S), g=c.getContext('2d');
  g.fillStyle='#EFEDE8'; g.fillRect(0,0,S,S);
  const t=tex(c); t.encoding=THREE.sRGBEncoding;
  const im=new Image();
  im.onload=()=>{
    const m=Math.min(im.width,im.height);
    g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
    g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,S,S);
    try{
      const d=g.getImageData(0,0,S,S), src=new Uint8ClampedArray(d.data);
      const k=0.42; // unsharp against a 4-neighbour blur
      for(let y=1;y<S-1;y++) for(let x=1;x<S-1;x++){
        const i=(y*S+x)*4;
        for(let ch=0;ch<3;ch++){
          const p=i+ch;
          const blur=(src[p-4]+src[p+4]+src[p-S*4]+src[p+S*4])*0.25;
          d.data[p]=src[p]+(src[p]-blur)*k;
        }
      }
      g.putImageData(d,0,0);
    }catch(e){}
    t.needsUpdate=true;
  };
  im.src=url;
  return t;
}


const BOARD_TXT={
 rlnc:{en:['RLNC','every packet is a mix of all four','any four that land rebuild the block'],
       ru:['RLNC','каждый пакет это смесь всех четырёх','любые четыре собирают блок заново'],
       uk:['RLNC','кожен пакет це суміш усіх чотирьох','будь-які чотири збирають блок наново'],
       tr:['RLNC','her paket dördünün karışımı','ulaşan herhangi dördü bloğu geri kurar'],
       id:['RLNC','setiap paket campuran dari keempatnya','empat mana pun bisa menyusun ulang blok'],
       vi:['RLNC','mỗi gói là hỗn hợp của cả bốn','bất kỳ bốn gói nào cũng dựng lại khối'],
       hi:['RLNC','हर पैकेट चारों का मिश्रण है','कोई भी चार मिलकर ब्लॉक बना देते हैं']},
 orig:{en:['THE ORIGINAL BLOCK'],ru:['ИСХОДНЫЙ БЛОК'],uk:['ПОЧАТКОВИЙ БЛОК'],tr:['ÖZGÜN BLOK'],id:['BLOK ASLI'],vi:['KHỐI GỐC'],hi:['मूल ब्लॉक']},
 reb:{en:['REBUILT FROM MIXES'],ru:['СОБРАН ИЗ СМЕСЕЙ'],uk:['ЗІБРАНИЙ ІЗ СУМІШЕЙ'],tr:['KARIŞIMLARDAN KURULDU'],id:['DISUSUN DARI CAMPURAN'],vi:['DỰNG LẠI TỪ HỖN HỢP'],hi:['मिश्रणों से पुनर्निर्मित']},
 mump:{en:['ONE BLOCK IN','coded packets out to every peer'],
       ru:['ОДИН БЛОК НА ВХОДЕ','закодированные пакеты каждому пиру'],
       uk:['ОДИН БЛОК НА ВХОДІ','закодовані пакети кожному піру'],
       tr:['GİRİŞTE TEK BLOK','her eşe kodlanmış paketler'],
       id:['SATU BLOK MASUK','paket berkode ke setiap peer'],
       vi:['MỘT KHỐI VÀO','gói mã hoá đến mọi peer'],
       hi:['एक ब्लॉक अंदर','हर पीयर तक कोडेड पैकेट']},
 gossip:{en:['GOSSIPSUB','the baseline'],ru:['GOSSIPSUB','точка отсчёта'],uk:['GOSSIPSUB','точка відліку'],tr:['GOSSIPSUB','temel çizgi'],id:['GOSSIPSUB','tolok ukur'],vi:['GOSSIPSUB','mốc so sánh'],hi:['GOSSIPSUB','आधार रेखा']},
 fast:{en:['OPTIMUM','6-20x faster'],ru:['OPTIMUM','в 6-20 раз быстрее'],uk:['OPTIMUM','у 6-20 разів швидше'],tr:['OPTIMUM','6-20 kat hızlı'],id:['OPTIMUM','6-20x lebih cepat'],vi:['OPTIMUM','nhanh hơn 6-20 lần'],hi:['OPTIMUM','6-20 गुना तेज़']},
 perm:{en:['PERMISSIONLESS','no consensus change'],ru:['БЕЗ РАЗРЕШЕНИЙ','консенсус не меняется'],uk:['БЕЗ ДОЗВОЛІВ','консенсус не змінюється'],tr:['İZİNSİZ','mutabakat değişmez'],id:['TANPA IZIN','konsensus tak berubah'],vi:['KHÔNG CẦN CẤP PHÉP','không đổi đồng thuận'],hi:['बिना अनुमति','कंसेंसस नहीं बदलता']},
 partners:{en:['40 PARTNERS','$24B ETH staked'],ru:['40 ПАРТНЁРОВ','$24 млрд ETH в стейке'],uk:['40 ПАРТНЕРІВ','$24 млрд ETH у стейку'],tr:['40 ORTAK','24 milyar $ ETH stake'],id:['40 MITRA','$24M ETH di-stake'],vi:['40 ĐỐI TÁC','24 tỷ $ ETH staking'],hi:['40 साझेदार','$24 अरब ETH स्टेक']},
 netcode:{en:['NETWORK CODING','y = a1x1 + a2x2 + a3x3','any four packets rebuild the block'],
          ru:['СЕТЕВОЕ КОДИРОВАНИЕ','y = a1x1 + a2x2 + a3x3','любые четыре пакета соберут блок'],
          uk:['МЕРЕЖЕВЕ КОДУВАННЯ','y = a1x1 + a2x2 + a3x3','будь-які чотири пакети зберуть блок'],
          tr:['AĞ KODLAMA','y = a1x1 + a2x2 + a3x3','herhangi dört paket bloğu kurar'],
          id:['NETWORK CODING','y = a1x1 + a2x2 + a3x3','empat paket mana pun menyusun blok'],
          vi:['MÃ HOÁ MẠNG','y = a1x1 + a2x2 + a3x3','bốn gói bất kỳ dựng lại khối'],
          hi:['नेटवर्क कोडिंग','y = a1x1 + a2x2 + a3x3','कोई भी चार पैकेट ब्लॉक बना देते हैं']},
 distr:{en:['DISTRIBUTED','systems and coding'],ru:['РАСПРЕДЕЛЁННЫЕ','системы и кодирование'],uk:['РОЗПОДІЛЕНІ','системи і кодування'],tr:['DAĞITIK','sistemler ve kodlama'],id:['TERDISTRIBUSI','sistem dan pengodean'],vi:['PHÂN TÁN','hệ thống và mã hoá'],hi:['वितरित','सिस्टम और कोडिंग']},
 adopt:{en:['ADOPTION','ecosystem and tokenomics'],ru:['ВНЕДРЕНИЕ','экосистема и токеномика'],uk:['ВПРОВАДЖЕННЯ','екосистема і токеноміка'],tr:['BENİMSENME','ekosistem ve tokenomi'],id:['ADOPSI','ekosistem dan tokenomik'],vi:['ỨNG DỤNG','hệ sinh thái và tokenomics'],hi:['अपनाना','इकोसिस्टम और टोकनॉमिक्स']},
 byz:{en:['BYZANTINE','fault tolerance'],ru:['ВИЗАНТИЙСКАЯ','отказоустойчивость'],uk:['ВІЗАНТІЙСЬКА','відмовостійкість'],tr:['BİZANS','hata toleransı'],id:['BYZANTINE','toleransi kesalahan'],vi:['BYZANTINE','chịu lỗi'],hi:['बीज़ेंटाइन','फ़ॉल्ट टॉलरेंस']},
 sig:{en:['SIGNALS','wireless and coding'],ru:['СИГНАЛЫ','беспроводная связь и кодирование'],uk:['СИГНАЛИ','бездротовий звʼязок і кодування'],tr:['SİNYALLER','kablosuz ve kodlama'],id:['SINYAL','nirkabel dan pengodean'],vi:['TÍN HIỆU','không dây và mã hoá'],hi:['सिग्नल','वायरलेस और कोडिंग']},
 rel:{en:['RELEASE TRAIN','plan, ship, repeat'],ru:['ПОЕЗД РЕЛИЗОВ','план, релиз, снова'],uk:['ПОТЯГ РЕЛІЗІВ','план, реліз, знову'],tr:['SÜRÜM TRENİ','planla, yayınla, tekrarla'],id:['KERETA RILIS','rencana, rilis, ulangi'],vi:['CHUYẾN TÀU PHÁT HÀNH','lên kế hoạch, phát hành, lặp lại'],hi:['रिलीज़ ट्रेन','योजना, रिलीज़, दोहराव']},
 story:{en:['THE STORY','make it understandable'],ru:['ИСТОРИЯ','сделать понятной'],uk:['ІСТОРІЯ','зробити зрозумілою'],tr:['HİKÂYE','anlaşılır kıl'],id:['CERITA','buat mudah dipahami'],vi:['CÂU CHUYỆN','làm cho dễ hiểu'],hi:['कहानी','इसे समझने योग्य बनाएँ']},
 commb:{en:['THE COMMUNITY','everyone gets an answer'],ru:['СООБЩЕСТВО','каждый получает ответ'],uk:['СПІЛЬНОТА','кожен отримує відповідь'],tr:['TOPLULUK','herkes yanıt alır'],id:['KOMUNITAS','semua orang dapat jawaban'],vi:['CỘNG ĐỒNG','ai cũng có câu trả lời'],hi:['कम्युनिटी','हर किसी को जवाब मिलता है']},
 ideas:{en:['IDEAS TO PRODUCTS','what ships, and when'],ru:['ИДЕИ В ПРОДУКТЫ','что выходит и когда'],uk:['ІДЕЇ В ПРОДУКТИ','що виходить і коли'],tr:['FİKİRDEN ÜRÜNE','ne, ne zaman çıkar'],id:['IDE JADI PRODUK','apa yang rilis, dan kapan'],vi:['Ý TƯỞNG THÀNH SẢN PHẨM','cái gì ra mắt, khi nào'],hi:['विचार से उत्पाद','क्या और कब आएगा']},
 y2003:{en:['2003','RLNC at MIT'],ru:['2003','RLNC в MIT'],uk:['2003','RLNC у MIT'],tr:['2003',"MIT'te RLNC"],id:['2003','RLNC di MIT'],vi:['2003','RLNC tại MIT'],hi:['2003','MIT में RLNC']},
 y2024:{en:['2024','Optimum founded'],ru:['2024','основан Optimum'],uk:['2024','засновано Optimum'],tr:['2024','Optimum kuruldu'],id:['2024','Optimum berdiri'],vi:['2024','Optimum thành lập'],hi:['2024','Optimum की स्थापना']},
 y2025:{en:['2025','$11M seed, 1kx'],ru:['2025','сид $11 млн, 1kx'],uk:['2025','сід $11 млн, 1kx'],tr:['2025','11M $ tohum, 1kx'],id:['2025','seed $11 jt, 1kx'],vi:['2025','vòng seed 11 triệu $, 1kx'],hi:['2025','$11M सीड, 1kx']},
 y2026:{en:['2026','mainnet soon'],ru:['2026','скоро мейннет'],uk:['2026','невдовзі мейннет'],tr:['2026','yakında ana ağ'],id:['2026','mainnet segera'],vi:['2026','sắp có mainnet'],hi:['2026','जल्द मेननेट']},
 client:{en:['CLIENT','block ready'],ru:['КЛИЕНТ','блок готов'],uk:['КЛІЄНТ','блок готовий'],tr:['İSTEMCİ','blok hazır'],id:['KLIEN','blok siap'],vi:['CLIENT','khối sẵn sàng'],hi:['क्लाइंट','ब्लॉक तैयार']},
 sidecar:{en:['mump2p','encode'],ru:['mump2p','кодирование'],uk:['mump2p','кодування'],tr:['mump2p','kodla'],id:['mump2p','pengodean'],vi:['mump2p','mã hoá'],hi:['mump2p','कोडिंग']},
 peer:{en:['PEER'],ru:['ПИР'],uk:['ПІР'],tr:['EŞ'],id:['PEER'],vi:['PEER'],hi:['पीयर']},
 chain:{en:['rules kept'],ru:['правила те же'],uk:['правила ті самі'],tr:['kurallar aynı'],id:['aturan tetap'],vi:['giữ nguyên luật'],hi:['नियम वही']}
};
function bt(id){ const e=BOARD_TXT[id]; return (e&&(e[LANG]||e.en))||[id]; }
const boardRefs=[];
function regBoard(mesh,id,accHex,kind){ boardRefs.push({m:mesh,id:id,c:accHex,k:kind||'board'}); return mesh; }
function framedBoard(g,w,h,id,accHex,x,y,z,ry){
  const fr=new THREE.Mesh(new THREE.BoxGeometry(w+0.34,h+0.34,0.16),
    new THREE.MeshLambertMaterial({color:0x2B2F36}));
  fr.position.set(x,y,z); if(ry) fr.rotation.y=ry; g.add(fr); outline(g,fr);
  const inner=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:boardTexture(bt(id),accHex),transparent:true,toneMapped:false}));
  const off=0.09;
  inner.position.set(x + (ry? Math.cos(ry)*off:0), y, z + (ry? -Math.sin(ry)*off : off));
  if(ry) inner.rotation.y=ry;
  g.add(inner);
  return regBoard(inner,id,accHex);
}
function refreshBoards(){
  for(let i=0;i<boardRefs.length;i++){
    const b=boardRefs[i];
    b.m.material.map = b.k==='tag' ? tagTexture(bt(b.id)[0], b.c)
                     : b.k==='screen' ? screenTexture(bt(b.id)[0], bt(b.id).slice(1), b.c)
                     : boardTexture(bt(b.id), b.c);
    b.m.material.needsUpdate=true;
  }
}
