/* ------------------------------ MATERIALS ------------------------------ */
const M = {};
function initMaterials(){
  // uvScale = texture tiles per world unit
  const stucco   = surf('stucco',  bakeStucco,   0.34, 1.5);
  const paint    = surf('paint',   bakePaint,    0.45, 0.8);
  const asphalt  = surf('asphalt', bakeAsphalt,  0.42, 2.0);
  const concrete = surf('concrete',bakeConcrete, 0.30, 1.7);
  const wood     = surf('wood',    bakeWood,     0.55, 1.3);
  const weave    = surf('weave',   bakeWeave,    1.10, 1.2);
  const weaveL   = surf('weaveL',  bakeWeaveLight, 1.10, 1.2);
  const brushed  = surf('brushed', bakeBrushed,  0.42, 0.9);
  const tile     = surf('tile',    bakeTile,     0.30, 1.6);

  const amb = PBR ? null : 0x14120e;

  M.wall     = SM({color:0xF0F2F4, map:stucco.map, normalMap:nm(stucco.normalMap), normalScale:1.0,
                   roughness:0.95, emissive:amb, uvScale:stucco.uvScale});
  M.wallIn   = SM({color:0xDFE5EB, map:paint.map, normalMap:nm(paint.normalMap), normalScale:0.35,
                   roughness:0.90, emissive:PBR?null:0x24282e, uvScale:paint.uvScale});
  M.trim     = SM({color:0xD3DBE2, roughness:0.70, metalness:0.10});
  M.dark     = SM({color:0x3A3E45, roughness:0.93, metalness:0.0});
  M.metal    = SM({color:0xC7D2DD, map:brushed.map, normalMap:nm(brushed.normalMap), normalScale:0.5,
                   roughness:0.44, metalness:0.30, uvScale:brushed.uvScale});
  M.blob     = new THREE.MeshPhongMaterial({color:0xB9C4D1, shininess:64, specular:0x93a2b3});
  M.floorIn  = SM({color:0xD6DDE5, map:tile.map, normalMap:nm(tile.normalMap), normalScale:0.85,
                   roughness:0.52, metalness:0.04, uvScale:tile.uvScale});
  M.ceil     = SM({color:0xE6ECF2, map:paint.map, roughness:0.96,
                   emissive:PBR?null:0x1a1712, uvScale:paint.uvScale});
  M.rope     = SM({color:C.rope, map:weaveL.map, normalMap:nm(weaveL.normalMap), normalScale:0.5,
                   roughness:0.86, emissive:PBR?null:0x2e0a05, uvScale:weaveL.uvScale});
  M.wood     = SM({color:0xA89075, map:wood.map, normalMap:nm(wood.normalMap), normalScale:0.8,
                   roughness:0.66, metalness:0.02, uvScale:wood.uvScale});
  M.fabric   = SM({color:0xAEBFCE, map:weave.map, normalMap:nm(weave.normalMap), normalScale:0.9,
                   roughness:0.98, uvScale:weave.uvScale});
  M.road     = SM({color:0xB0BED1, roughness:0.80});
  M.shadow   = new THREE.MeshBasicMaterial({color:0x9AA7B6, transparent:true, opacity:.28});
  M.walk     = SM({color:0xE6EBF0, map:concrete.map, normalMap:nm(concrete.normalMap), normalScale:0.75,
                   roughness:0.93, uvScale:concrete.uvScale});
  M.grass    = SM({color:SEASONS[SEASON].grass, roughness:0.98});
  M.asphalt  = SM({color:0xE2E8EE, map:asphalt.map, normalMap:nm(asphalt.normalMap), normalScale:1.0,
                   roughness:0.94, uvScale:asphalt.uvScale});
  M.edge     = new THREE.LineBasicMaterial({color:C.edge});
}
